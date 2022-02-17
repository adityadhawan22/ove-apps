const { Constants } = require('./client/constants/html');
const HttpStatus = require('http-status-codes');
const path = require('path');
const fs = require('fs');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { express, app, log, nodeModules, Utils } = base;
const request = require('request');
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
        socket.on('message', function (m) {
            // The clock sync request is the one with the highest priority and the server should make
            // no further checks before responding. Matching code is used in client and server sides.
            clock.sync(JSON.parse(m));
        });
        socket.on('error', log.error);
    };
    getSocket();
}, Constants.SOCKET_READY_WAIT_TIME);

const handleOperation = function (req, res) {
    const sectionId = req.query.oveSectionId;
    const operation = req.params.name;

    let message = { operation: operation };
    switch (operation) {
        case Constants.Operation.REFRESH:
            if (sectionId) {
                log.info('Refreshing section:', sectionId);
            } else {
                log.info('Refreshing all sections');
            }
            message.changeAt = clock.getTime() + Constants.OPERATION_SYNC_DELAY;
            break;
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
app.post('/operation/:name(' + operationsList.join('|') + ')', handleOperation);

// Expose the distributed JS library and helper scripts.
app.use('/libs/:name(distributed).js', function (req, res) {
    request('http://' + Utils.getOVEHost() + '/jquery.min.js', function (err, _res, body) {
        if (err) {
            log.error('Failed to load jquery:', err);
            Utils.sendMessage(res, HttpStatus.BAD_REQUEST,
                JSON.stringify({ error: 'failed to load dependency' }));
            return;
        }

        let text = body + '\n';
        request('http://' + Utils.getOVEHost() + '/ove.js', function (err, _res, body) {
            if (err) {
                log.error('Failed to load ove.js:', err);
                Utils.sendMessage(res, HttpStatus.BAD_REQUEST,
                    JSON.stringify({ error: 'failed to load dependency' }));
                return;
            }
            text += body + '\n' +
                fs.readFileSync(path.join(__dirname, 'libs', req.params.name + '.js'));
            res.set(Constants.HTTP_HEADER_CONTENT_TYPE, Constants.HTTP_CONTENT_TYPE_JS).send(text
                .replace(/__OVEHOST__/g, Utils.getOVEHost()));
        });
    });
});
app.use('/libs/distributed', express.static(path.join(__dirname, 'libs', 'distributed')));

log.debug('Setting up state validation operation');
base.operations.validateState = function (state) {
    return Utils.validateState(state, [ { value: ['state.url'] } ]);
};

const port = process.env.PORT || 8080;
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
