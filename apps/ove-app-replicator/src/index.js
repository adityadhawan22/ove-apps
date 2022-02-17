const { Constants } = require('./client/constants/replicator');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { app, Utils, log } = base;
const server = require('http').createServer(app);
const portfinder = require('portfinder');

log.debug('Setting up state validation operation');
base.operations.validateState = function (state) {
  return Utils.validateState(state, [{ value: ['state.mode'] }]);
};

async function findPort(start = 8080) {
  return await portfinder.getPortPromise({
    port: start,
    stopPort: 8100,
  });
}

(async () => {
  const port = process.env.PORT || (await findPort());

  server.listen(port);
  log.info(Constants.APP_NAME, 'application started, port:', port);
})();
