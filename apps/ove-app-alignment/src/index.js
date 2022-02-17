const { Constants } = require('./client/constants/alignment');
const path = require('path');
const { express, app, log, nodeModules } = require('@ove-lib/appbase')(
  __dirname,
  Constants.APP_NAME
);
const server = require('http').createServer(app);
const portfinder = require('portfinder');

log.debug('Using module:', 'd3');
app.use('/', express.static(path.join(nodeModules, 'd3', 'dist')));

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
