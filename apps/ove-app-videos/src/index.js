const { Constants } = require('./client/constants/videos');
const HttpStatus = require('http-status-codes');
const path = require('path');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { express, app, appState, log, nodeModules, Utils } = base;
const server = require('http').createServer(app);

// BACKWARDS-COMPATIBILITY: For <= v0.4.1
if (!Constants.CLOCK_SYNC_ATTEMPTS) {
    Constants.CLOCK_SYNC_ATTEMPTS = 5;
}
if (!Constants.CLOCK_SYNC_INTERVAL) {
    Constants.CLOCK_SYNC_INTERVAL = 120000;
}
const getClock = function () {
    let clock = {
        uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0;
            let v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        })
    };
    let __self = {};

    __self.init = function () {
        if (!clock.syncResults) {
            clock.syncResults = [];
        }
        if (clock.syncResults.length < Constants.CLOCK_SYNC_ATTEMPTS) {
            const clockSyncRequest = function () {
                /* istanbul ignore next */
                // Our tests do not wait for the timeout for this code to run
                // The functionality of safeSend is tested elsewhere.
                try {
                    clock.socket.safeSend(JSON.stringify({
                        appId: Constants.APP_NAME,
                        sync: { id: clock.uuid }
                    }));
                } catch (e) {} // ignore all errors, since there is no value in recording them.
            };
            // We trigger a clock-sync 5 times within a 2 minute period.
            for (let i = 0; i < Constants.CLOCK_SYNC_ATTEMPTS; i++) {
                // If we lost socket connection in between syncs, we may have already
                // made some sync requests.
                if (clock.syncResults.length + i < Constants.CLOCK_SYNC_ATTEMPTS) {
                    setTimeout(clockSyncRequest, Math.random() *
                        (Constants.CLOCK_SYNC_INTERVAL / Constants.CLOCK_SYNC_ATTEMPTS) | 0);
                }
            }
        }
    };

    __self.sync = function (data) {
        if (data.sync) {
            if (!data.sync.t2) {
                try {
                    clock.socket.safeSend(JSON.stringify({
                        appId: data.appId,
                        sync: {
                            id: data.sync.id,
                            serverDiff: data.sync.serverDiff,
                            t1: new Date().getTime()
                        }
                    }));
                } catch (e) {} // ignore all errors, since there is no value in recording them.
            } else {
                // We must construct the sync result similar to the server, to avoid differences.
                let syncResult = {
                    appId: data.appId,
                    sync: {
                        id: data.sync.id,
                        serverDiff: data.sync.serverDiff,
                        t3: new Date().getTime(),
                        t2: data.sync.t2,
                        t1: data.sync.t1
                    }
                };
                // Always broadcast a difference as an integer
                let diff = ((syncResult.sync.t1 + syncResult.sync.t3) / 2 -
                    syncResult.sync.t2 - syncResult.sync.serverDiff) | 0;
                /* istanbul ignore if */
                // This scenario would not occur during test
                if (clock.diff) {
                    diff -= clock.diff;
                }
                clock.syncResults.push({ id: data.sync.id, diff: diff });
                log.trace('Clock skew detection attempt:', clock.syncResults.length, 'difference:', diff);
                if (clock.syncResults.length === Constants.CLOCK_SYNC_ATTEMPTS) {
                    try {
                        clock.socket.safeSend(JSON.stringify({
                            appId: Constants.APP_NAME,
                            syncResults: clock.syncResults
                        }));
                    } catch (e) {} // ignore all errors, since there is no value in recording them.
                }
            }
            log.trace('Responded to sync request');
            return true;
        } else if (data.clockDiff) {
            let diff = data.clockDiff[clock.uuid];
            clock.diff = (clock.diff || 0) + diff;
            log.debug('Got a clock difference of:', diff);
            /* istanbul ignore if */
            // This scenario would not occur during test
            if (diff) {
                clock.syncResults = [];
                this.init();
            }
            return true;
        } else if (data.clockReSync) {
            clock.syncResults = [];
            this.init();
            return true;
        }
        return false;
    };

    __self.getTime = function () {
        return new Date().getTime() - (clock.diff || 0);
    };

    __self.setWS = function (socket) {
        clock.socket = socket;
    };

    return __self;
};
const clock = getClock();

log.debug('Using module:', 'fontawesome-free');
app.use('/images', express.static(path.join(nodeModules, '@fortawesome', 'fontawesome-free', 'svgs', 'solid')));

let ws;
appState.set('bufferStatus', []);
setTimeout(function () {
    const getSocket = function () {
        const socketURL = 'ws://' + Utils.getOVEHost();
        log.debug('Establishing WebSocket connection with:', socketURL);
        let socket = new (require('ws'))(socketURL);
        ws = Utils.getSafeSocket(socket);
        clock.setWS(ws);
        socket.on('open', function () {
            clock.init();
            log.debug('WebSocket connection made with:', socketURL);
        });
        socket.on('close', function (code) {
            log.warn('Lost websocket connection: closed with code:', code);
            log.warn('Attempting to reconnect in ' + Constants.SOCKET_REFRESH_DELAY + 'ms');
            // If the socket is closed, we try to refresh it.
            setTimeout(getSocket, Constants.SOCKET_REFRESH_DELAY);
        });
        socket.on('error', log.error);
        socket.on('message', function (msg) {
            let m = JSON.parse(msg);
            // The clock sync request is the one with the highest priority and the server should make
            // no further checks before responding. Matching code is used in client and server sides.
            if (clock.sync(m)) {
                return;
            }

            if (m.appId === Constants.APP_NAME && m.message.bufferStatus) {
                // The handling of the buffer status updates operates in a model as noted below. This
                // same as the model followed by browser-based viewers and controllers.
                //   1. One or more peers in a group receives a new video URL
                //   2. They then send a request for registration to all peers belonging to the same
                //      section.
                //   3. When one or more peers respond, their responses will then be received as
                //      registration responses. If a peer does not respond, the rest of the system
                //      will not wait. If a peer is late to respond, they may join the group later on,
                //      but this will not stop a video that is already playing.
                //   4. After the above steps are completed peers start broadcasting their buffer statuses.
                //   5. If at least 15% of a video is buffered across all peers synchronized playback
                //      can begin and the video will be displayed.
                let bufferStatus = appState.get('bufferStatus[' + m.sectionId + ']');
                let status = m.message.bufferStatus;
                let bufferIsEmpty = Utils.isNullOrEmpty(bufferStatus);
                if (status.type.registration) {
                    if (bufferIsEmpty) {
                        bufferStatus = { clients: [] };
                        bufferStatus.clients.push(status.clientId);
                        bufferIsEmpty = false;
                    } else if (!bufferStatus.clients.includes(status.clientId)) {
                        bufferStatus.clients.push(status.clientId);
                    }
                } else if (status.type.update && !bufferIsEmpty &&
                    bufferStatus.clients.includes(status.clientId)) {
                    if (status.percentage >= Constants.MIN_BUFFERED_PERCENTAGE ||
                        status.duration >= Constants.MIN_BUFFERED_DURATION) {
                        bufferStatus.clients.splice(bufferStatus.clients.indexOf(status.clientId), 1);
                        if (bufferStatus.clients.length === 0) {
                            appState.del('bufferStatus[' + m.sectionId + ']');
                            return;
                        }
                    }
                }
                if (!bufferIsEmpty) {
                    appState.set('bufferStatus[' + m.sectionId + ']', bufferStatus);
                }
            }
        });
    };
    getSocket();
}, Constants.SOCKET_READY_WAIT_TIME);

const handleOperation = function (req, res) {
    let name = req.params.name;
    let sectionId = req.query.oveSectionId;
    if (sectionId) {
        log.info('Performing operation:', name, ', on section:', sectionId);
    } else {
        log.info('Performing operation:', name, ', on all sections');
    }
    // If this is a buffer status check and depending on whether a sectionId is provided, below
    // code checks whether buffering is in progress.
    if (name === Constants.Operation.BUFFER_STATUS) {
        const bufferStatus = appState.get('bufferStatus');
        let isComplete = true;
        if (sectionId) {
            isComplete = Utils.isNullOrEmpty(bufferStatus[sectionId]);
        } else {
            bufferStatus.some(function (s) {
                if (s && JSON.stringify(s) !== Utils.JSON.EMPTY) {
                    isComplete = false;
                    return true;
                }
            });
        }
        res.status(HttpStatus.OK).set(Constants.HTTP_HEADER_CONTENT_TYPE, Constants.HTTP_CONTENT_TYPE_JSON).send(
            JSON.stringify({ status: (isComplete ? Constants.BufferStatus.COMPLETE : Constants.BufferStatus.BUFFERING) }));
        return;
    }

    // Play, Mute and SeekTo commands receive additional query parameters.
    let message = { operation: { name: name, executionTime: (clock.getTime() + Constants.OPERATION_SYNC_DELAY) } };
    if (name === Constants.Operation.SEEK) {
        // We assume that the seek time is properly set instead of enforcing any strict type checks.
        message.operation.time = req.query.time;
    } else if (name === Constants.Operation.MUTE) {
        message.operation.mute = (typeof req.query.mute !== 'undefined' &&
            JSON.parse(String(req.query.mute).toLowerCase()));
    } else if (name === Constants.Operation.PLAY) {
        // Checks whether the loop parameter is defined and it equals to true.
        // The typeof check is better than an equals check since undefined can
        // be overridden.
        message.operation.loop = (typeof req.query.loop !== 'undefined' &&
            JSON.parse(String(req.query.loop).toLowerCase()));
    }
    // If the section id is not set the message will be available to all the sections.
    if (sectionId) {
        ws.safeSend(JSON.stringify({ appId: Constants.APP_NAME, sectionId: sectionId, message: message }));
    } else {
        ws.safeSend(JSON.stringify({ appId: Constants.APP_NAME, message: message }));
    }
    res.status(HttpStatus.OK).set(Constants.HTTP_HEADER_CONTENT_TYPE,
        Constants.HTTP_CONTENT_TYPE_JSON).send(Utils.JSON.EMPTY);
};

let operationsList = Object.values(Constants.Operation);
operationsList.splice(operationsList.indexOf(Constants.Operation.BUFFER_STATUS));
app.post('/operation/:name(' + operationsList.join('|') + ')', handleOperation);

// BACKWARDS-COMPATIBILITY: For <= v0.2.0
app.get('/operation/:name(' + operationsList.join('|') + ')', handleOperation);

app.get('/operation/:name(' + Constants.Operation.BUFFER_STATUS + ')', handleOperation);

log.debug('Setting up state validation operation');
base.operations.validateState = function (state) {
    return Utils.validateState(state, [ { value: ['state.url'] } ]);
};

const port = process.env.PORT || 8080;
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
