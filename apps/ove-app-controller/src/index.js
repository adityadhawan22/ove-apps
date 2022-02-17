const { Constants } = require('./client/constants/controller');
const path = require('path');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { express, app, Utils, log, nodeModules } = base;
const server = require('http').createServer(app);

log.debug('Using module:', 'd3');
app.use('/', express.static(path.join(nodeModules, 'd3', 'dist')));
log.debug('Using module:', 'fontawesome-free');
app.use('/images', express.static(path.join(nodeModules, '@fortawesome', 'fontawesome-free', 'svgs', 'solid')));

log.debug('Setting up state validation operation');
base.operations.validateState = function (state) {
    return Utils.validateState(state, [ { value: ['state.mode'] } ]);
};

const port = process.env.PORT || 8080;
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
