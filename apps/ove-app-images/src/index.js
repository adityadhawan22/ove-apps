const { Constants } = require('./client/constants/images');
const HttpStatus = require('http-status-codes');
const path = require('path');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { express, app, Utils, log, nodeModules } = base;
const server = require('http').createServer(app);
const portfinder = require('portfinder');

log.debug('Using module:', 'openseadragon');
app.use(
  '/',
  express.static(
    path.join(nodeModules, 'openseadragon', 'build', 'openseadragon')
  )
);

log.debug('Setting up state transformation operations');
base.operations.canTransform = function (state, transformation) {
  const combinations = [
    [
      'state',
      'transformation',
      'transformation.zoom',
      'transformation.pan',
      'transformation.pan.x',
      'transformation.pan.y',
      'state.viewport',
      'state.viewport.bounds',
      'state.viewport.bounds.x',
      'state.viewport.bounds.y',
      'state.viewport.bounds.w',
      'state.viewport.bounds.h',
      'state.viewport.dimensions',
      'state.viewport.dimensions.w',
      'state.viewport.dimensions.h',
      'state.viewport.zoom',
    ],
    [
      'state',
      'transformation',
      'transformation.zoom',
      'state.viewport',
      'state.viewport.zoom',
    ],
    [
      'state',
      'transformation',
      'transformation.pan',
      'transformation.pan.x',
      'transformation.pan.y',
      'state.offset',
      'state.offset.x',
      'state.offset.y',
    ],
    [
      'state',
      'transformation',
      'transformation.pan',
      'transformation.pan.x',
      'transformation.pan.y',
      'state.viewport',
      'state.viewport.bounds',
      'state.viewport.bounds.x',
      'state.viewport.bounds.y',
      'state.viewport.bounds.w',
      'state.viewport.bounds.h',
      'state.viewport.dimensions',
      'state.viewport.dimensions.w',
      'state.viewport.dimensions.h',
    ],
  ];

  let canTransform = false;
  combinations.forEach(function (e) {
    let result = true;
    e.forEach(function (x) {
      result =
        result &&
        !Utils.isNullOrEmpty(
          Utils.JSON.getDescendant(x, {
            state: state,
            transformation: transformation,
          })
        );
    });
    canTransform = canTransform || result;
  });
  log.debug(
    'Can' + (canTransform ? '' : "'t") + 'transform state:',
    state,
    'using:',
    transformation
  );
  return canTransform;
};

base.operations.transform = function (input, transformation) {
  let output = JSON.parse(JSON.stringify(input));
  if (transformation.pan) {
    // We need to force a parseFloat operation to avoid a string manipulation
    output.viewport.bounds.x =
      +output.viewport.bounds.x +
      (transformation.pan.x * output.viewport.bounds.w) /
        output.viewport.dimensions.w;
    output.viewport.bounds.y =
      +output.viewport.bounds.y +
      (transformation.pan.y * output.viewport.bounds.h) /
        output.viewport.dimensions.h;
  }
  if (transformation.zoom) {
    output.viewport.zoom *= transformation.zoom;
  }
  log.debug(
    'Successfully transformed state from:',
    input,
    'to:',
    output,
    'using:',
    transformation
  );
  return output;
};

base.operations.canDiff = function (source, target) {
  const getCanDiff = function (state) {
    const combination = [
      'state',
      'state.viewport',
      'state.viewport.bounds',
      'state.viewport.bounds.x',
      'state.viewport.bounds.y',
      'state.viewport.bounds.w',
      'state.viewport.bounds.h',
      'state.viewport.dimensions',
      'state.viewport.dimensions.w',
      'state.viewport.dimensions.h',
      'state.viewport.zoom',
      'state.config',
    ];

    let canDiff = true;
    combination.forEach(function (x) {
      canDiff =
        canDiff &&
        !Utils.isNullOrEmpty(Utils.JSON.getDescendant(x, { state: state }));
    });
    return canDiff;
  };
  const result =
    getCanDiff(source) &&
    getCanDiff(target) &&
    Utils.JSON.equals(source.config, target.config);
  log.debug(
    'Can' + (result ? '' : "'t") + 'difference source:',
    source,
    'and target:',
    target
  );
  return result;
};

base.operations.diff = function (source, target) {
  const result = {
    zoom: target.viewport.zoom / source.viewport.zoom,
    pan: {
      x:
        (target.viewport.bounds.x / target.viewport.bounds.w -
          source.viewport.bounds.x / source.viewport.bounds.w) *
        source.viewport.dimensions.w,
      y:
        (target.viewport.bounds.y / target.viewport.bounds.h -
          source.viewport.bounds.y / source.viewport.bounds.h) *
        source.viewport.dimensions.h,
    },
  };
  log.debug(
    'Successfully computed difference:',
    result,
    'from source:',
    source,
    'to target:',
    target
  );
  return result;
};

let ws;
setTimeout(function () {
  const getSocket = function () {
    const socketURL = 'ws://' + Utils.getOVEHost();
    log.debug('Establishing WebSocket connection with:', socketURL);
    let socket = new (require('ws'))(socketURL);
    ws = Utils.getSafeSocket(socket);
    socket.on('open', function () {
      log.debug('WebSocket connection made with:', socketURL);
    });
    socket.on('close', function (code) {
      log.warn('Lost websocket connection: closed with code:', code);
      log.warn(
        'Attempting to reconnect in ' + Constants.SOCKET_REFRESH_DELAY + 'ms'
      );
      // If the socket is closed, we try to refresh it.
      setTimeout(getSocket, Constants.SOCKET_REFRESH_DELAY);
    });
    socket.on('error', log.error);
  };
  getSocket();
}, Constants.SOCKET_READY_WAIT_TIME);

const handleOperation = function (req, res) {
  let name = req.params.name;
  log.info('NAME: ', name);
  let sectionId = req.query.oveSectionId;
  if (sectionId) {
    log.info('Performing operation:', name, ', on section:', sectionId);
  } else {
    log.info('Performing operation:', name, ', on all sections');
  }

  // Pan and Zoom commands receive additional query parameters.
  let message = { operation: { name: name } };
  if (name === Constants.Operation.PAN) {
    // We assume that the viewport's pan properties are properly set instead of enforcing any strict type checks.
    message.operation.x = req.query.x;
    message.operation.y = req.query.y;
  } else if (name === Constants.Operation.ZOOM) {
    // We assume that the zoom property is properly set instead of enforcing any strict type checks.
    message.operation.zoom = req.query.zoom;
  }

  // If the section id is not set the message will be available to all the sections.
  if (sectionId) {
    ws.safeSend(
      JSON.stringify({
        appId: Constants.APP_NAME,
        sectionId: sectionId,
        message: message,
      })
    );
  } else {
    ws.safeSend(
      JSON.stringify({ appId: Constants.APP_NAME, message: message })
    );
  }

  res
    .status(HttpStatus.OK)
    .set(Constants.HTTP_HEADER_CONTENT_TYPE, Constants.HTTP_CONTENT_TYPE_JSON)
    .send(JSON.stringify({}));
};

const operationsList = Object.values(Constants.Operation);
app.post('/operation/:name(' + operationsList.join('|') + ')', handleOperation);

log.debug('Setting up state validation operation');
base.operations.validateState = function (state) {
  return (
    Utils.validateState(state, [
      {
        value: [
          'state.viewport',
          'state.viewport.bounds',
          'state.viewport.bounds.x',
          'state.viewport.bounds.y',
          'state.viewport.bounds.w',
          'state.viewport.bounds.h',
          'state.viewport.dimensions',
          'state.viewport.dimensions.w',
          'state.viewport.dimensions.h',
          'state.viewport.zoom',
          'state.config',
        ],
      },
    ]) ||
    Utils.validateState(state, [{ prefix: ['state.url'] }]) ||
    Utils.validateState(state, [{ prefix: ['state.tileSources'] }])
  );
};

async function findPort(start = 8080) {
  return await portfinder.getPortPromise({
    port: start,
    stopPort: 8100,
  });
}

(async () => {
  const port = process.env.PORT || (await findPort()) || 1;

  server.listen(port);
  log.info(Constants.APP_NAME, 'application started, port:', port);
})();
