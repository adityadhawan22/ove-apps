const { Constants } = require('./client/constants/replicator');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { app, Utils, log } = base;
const server = require('http').createServer(app);

log.debug('Setting up state validation operation');
base.operations.validateState = state => Utils.validateState(state, [{ value: ['state.mode'] }]);

const port = parseInt(process.env.PORT || 8080, 10);
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
