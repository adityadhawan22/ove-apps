const { Constants } = require('./client/constants/whiteboard');
const path = require('path');
const { express, app, log, nodeModules } = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const server = require('http').createServer(app);

log.debug('Using module:', 'fontawesome-free');
app.use('/images', express.static(path.join(nodeModules, '@fortawesome', 'fontawesome-free', 'svgs', 'solid')));

const port = process.env.PORT || 8080;
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
