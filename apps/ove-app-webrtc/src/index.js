const { Constants } = require('./client/constants/webrtc');
const HttpStatus = require('http-status-codes');
const path = require('path');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { express, app, appState, Utils, log, nodeModules, config } = base;
const { OpenVidu, OpenViduRole } = require('openvidu-node-client');
const server = require('http').createServer(app);

log.debug('Using module:', 'openvidu-browser');
app.use('/', express.static(path.join(nodeModules, 'openvidu-browser', 'static', 'js')));
log.debug('Using module:', 'fontawesome-free');
app.use('/images', express.static(path.join(nodeModules, '@fortawesome', 'fontawesome-free', 'svgs', 'solid')));

// Logic to obtain the OpenVidu session token
appState.set('sessions', []);
if (!Constants.OPENVIDU_HOST) {
    log.fatal('OpenVidu instance is not available. Cannot generate tokens');
} else {
    // Ignore self-signed certificate authorization error
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const ov = new OpenVidu(Constants.OPENVIDU_HOST, process.env.OPENVIDU_SECRET || config.secret);
    app.get('/operation/token', function (req, res) {
        const id = req.query.sessionId + '-' + req.query.username;
        const session = appState.get('sessions[' + id + ']');
        if (session) {
            log.debug('Existing session:', id);
            res.status(HttpStatus.OK).set(Constants.HTTP_HEADER_CONTENT_TYPE, Constants.HTTP_CONTENT_TYPE_JSON)
                .send(JSON.stringify(session));
        } else {
            log.debug('New session:', id);
            ov.createSession({ customSessionId: req.query.sessionId }).then(session => {
                session.generateToken({ role: OpenViduRole.SUBSCRIBER }).then(token => {
                    appState.set('sessions[' + id + ']', token);
                    res.status(HttpStatus.OK).set(Constants.HTTP_HEADER_CONTENT_TYPE, Constants.HTTP_CONTENT_TYPE_JSON)
                        .send(JSON.stringify(token));
                }).catch(log.error);
            }).catch(log.error);
        }
    });
}

log.debug('Setting up state validation operation');
base.operations.validateState = function (state) {
    return Utils.validateState(state, [ { value: ['state.sessionId'] }, { prefix: ['state.maxSessions'] } ]);
};

const port = process.env.PORT || 8080;
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
