const { Constants } = require('./client/constants/whiteboard');
const path = require('path');
const { express, app, log, nodeModules } = require('@ove-lib/appbase')(
  __dirname,
  Constants.APP_NAME
);
const server = require('http').createServer(app);
const portfinder = require('portfinder');

log.debug('Using module:', 'fontawesome-free');
app.use(
  '/images',
  express.static(
    path.join(nodeModules, '@fortawesome', 'fontawesome-free', 'svgs', 'solid')
  )
);

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
