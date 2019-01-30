const { Constants } = require('./client/constants/html');
const HttpStatus = require('http-status-codes');
const path = require('path');
const fs = require('fs');
const { express, app, log, Utils } = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const request = require('request');
const server = require('http').createServer(app);

// BACKWARDS-COMPATIBILITY: For v0.2.0
if (!Utils.getOVEHost) {
    Utils.getOVEHost = function () {
        return process.env.OVE_HOST;
    };
}

var ws;
setTimeout(function () {
    const getSocket = function () {
        const socketURL = 'ws://' + Utils.getOVEHost();
        log.debug('Establishing WebSocket connection with:', socketURL);
        ws = new (require('ws'))(socketURL);
        ws.on('close', function (code) {
            log.warn('Lost websocket connection: closed with code:', code);
            log.warn('Attempting to reconnect in ' + Constants.SOCKET_REFRESH_DELAY + 'ms');
            // If the socket is closed, we try to refresh it.
            setTimeout(getSocket, Constants.SOCKET_REFRESH_DELAY);
        });
        ws.on('error', log.error);
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
            message.changeAt = new Date().getTime() + Constants.OPERATION_SYNC_DELAY;
            break;
    }

    // If the section id is not set the message will be available to all the sections.
    if (sectionId) {
        ws.send(JSON.stringify({ appId: Constants.APP_NAME, sectionId: sectionId, message: message }));
    } else {
        ws.send(JSON.stringify({ appId: Constants.APP_NAME, message: message }));
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

const port = process.env.PORT || 8080;
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
