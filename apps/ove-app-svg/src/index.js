const { Constants } = require('./client/constants/svg');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { app, Utils, log } = base;
const server = require('http').createServer(app);

log.debug('Setting up state validation operation');
base.operations.validateState = function (state) {
    return Utils.validateState(state, [ { value: ['state.url'] } ]);
};

const port = process.env.PORT || 8080;
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
