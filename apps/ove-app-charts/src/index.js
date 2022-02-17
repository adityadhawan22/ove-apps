const { Constants } = require('./client/constants/charts');
const path = require('path');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { express, app, Utils, log, nodeModules } = base;
const server = require('http').createServer(app);

for (const mod of ['vega', 'vega-lite', 'vega-embed']) {
    log.debug('Using module:', mod);
    app.use('/', express.static(path.join(nodeModules, mod, 'build')));
}

log.debug('Setting up state validation operation');
base.operations.validateState = function (state) {
    return Utils.validateState(state, [ { value: ['state.url'] } ]) || Utils.validateState(state, [ { value: ['state.spec'] } ]);
};

const port = process.env.PORT || 8080;
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
