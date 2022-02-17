const { Constants } = require('./client/constants/qrcode');
const path = require('path');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { express, app, log, Utils, nodeModules } = base;

const server = require('http').createServer(app);

// Serve the qrious.js file
app.use('/', express.static(path.join(nodeModules, 'qrious', 'dist')));

log.debug('Setting up state validation operation');
base.operations.validateState = function (state) {
    return Utils.validateState(state, [ { value: ['state.url'] } ]);
};

const port = process.env.PORT || 8080;
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
