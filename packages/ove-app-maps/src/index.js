const { Constants } = require('./client/constants/maps');
const HttpStatus = require('http-status-codes');
const path = require('path');
const base = require('@ove-lib/appbase')(__dirname, Constants.APP_NAME);
const { express, app, Utils, log, nodeModules, config } = base;
const request = require('request');
const fs = require('fs');
const server = require('http').createServer(app);

const runner = function (m) {
    m.message.name = Constants.Events.UPDATE;
    ws.safeSend(JSON.stringify(m));
};

let uuid = 0;
let queue = Utils.getPriorityQueue((a, b) => a.message.uuid > b.message.uuid, runner);

let layers = [];
// The map layers can be provided as an embedded JSON data structure or as a URL pointing
// to a location at which it is stored externally.
const loadMapLayers = function ($path) {
    try {
        if (new URL($path)) {
            request($path, { json: true }, function (err, _res, body) {
                if (err) {
                    log.error('Failed to load map layers:', err);
                } else {
                    layers = body;
                }
            });
            return;
        }
    } catch (_ignore) {}
    if (fs.existsSync($path)) {
        layers = JSON.parse(fs.readFileSync($path));
    } else {
        log.error('Failed to load map layers from path:', $path);
    }
};
if (process.env.OVE_MAPS_LAYERS) {
    log.info('Loading map layers from environment variable:', process.env.OVE_MAPS_LAYERS);
    loadMapLayers(process.env.OVE_MAPS_LAYERS);
} else if (typeof config.layers === 'string') {
    log.info('Loading map layers from URL:', config.layers);
    loadMapLayers(config.layers);
} else {
    log.info('Loading map layers from configuration');
    layers = config.layers;
}
app.get('/layers.json', function (_req, res) {
    res.send(JSON.stringify(layers));
});
log.debug('Using module:', 'ol');
app.use('/ol', express.static(path.join(nodeModules, 'ol')));
log.debug('Using module:', 'leaflet');
app.use('/', express.static(path.join(nodeModules, 'leaflet', 'dist')));
log.debug('Using module:', 'carto.js');
app.use('/', express.static(path.join(nodeModules, '@carto', 'carto.js')));
log.debug('Using module:', 'torque.js');
app.use('/', express.static(path.join(nodeModules, 'torque.js', 'dist')));
log.debug('Using module:', 'topojson-client');
app.use('/', express.static(path.join(nodeModules, 'topojson-client', 'dist')));

log.debug('Setting up state transformation operations');
base.operations.canTransform = function (state, transformation) {
    const combinations = [
        ['state', 'transformation', 'transformation.zoom', 'transformation.pan', 'transformation.pan.x',
            'transformation.pan.y', 'state.center', 'state.resolution'],
        ['state', 'transformation', 'transformation.zoom', 'transformation.pan', 'transformation.pan.x',
            'transformation.pan.y', 'state.position', 'state.position.center', 'state.position.resolution',
            'state.position.bounds', 'state.position.bounds.x', 'state.position.bounds.y', 'state.position.bounds.w',
            'state.position.bounds.h'],
        ['state', 'transformation', 'transformation.zoom', 'state.resolution'],
        ['state', 'transformation', 'transformation.zoom', 'state.position', 'state.position.resolution',
            'state.position.bounds', 'state.position.center', 'state.position.bounds.x', 'state.position.bounds.y',
            'state.position.bounds.w', 'state.position.bounds.h'],
        ['state', 'transformation', 'transformation.pan', 'transformation.pan.x', 'transformation.pan.y',
            'state.center', 'state.resolution'],
        ['state', 'transformation', 'transformation.pan', 'transformation.pan.x', 'transformation.pan.y',
            'state.position', 'state.position.center', 'state.position.resolution', 'state.position.bounds',
            'state.position.bounds.x', 'state.position.bounds.y']
    ];

    let canTransform = false;
    combinations.forEach(function (e) {
        let result = true;
        e.forEach(function (x) {
            result = result && !Utils.isNullOrEmpty(
                Utils.JSON.getDescendant(x, { state: state, transformation: transformation }));
        });
        canTransform = canTransform || result;
    });
    log.debug('Can' + (canTransform ? '' : '\'t') + 'transform state:', state, 'using:', transformation);
    return canTransform;
};

base.operations.transform = function (input, transformation) {
    let output = JSON.parse(JSON.stringify(input));
    if (transformation.pan) {
        if (output.center) {
            // We need to force a parseFloat operation to avoid a string manipulation
            output.center[0] = +(output.center[0]) + transformation.pan.x * output.resolution;
            output.center[1] = +(output.center[1]) - transformation.pan.y * output.resolution;
        } else {
            output.position.center[0] = +(output.position.center[0]) + transformation.pan.x * output.position.resolution;
            output.position.center[1] = +(output.position.center[1]) - transformation.pan.y * output.position.resolution;
            output.position.bounds.x = +(output.position.bounds.x) + transformation.pan.x * output.position.resolution;
            output.position.bounds.y = +(output.position.bounds.y) - transformation.pan.y * output.position.resolution;
        }
    }
    if (transformation.zoom) {
        if (output.resolution) {
            output.resolution /= transformation.zoom;
            output.zoom = +(output.zoom) + Math.ceil(Math.log2(transformation.zoom));
        } else {
            output.position.resolution /= transformation.zoom;
            output.position.zoom = +(output.position.zoom) + Math.ceil(Math.log2(transformation.zoom));
            output.position.bounds.w /= transformation.zoom;
            output.position.bounds.h /= transformation.zoom;
            output.position.bounds.x = (output.position.center[0] * (transformation.zoom - 1) +
                output.position.bounds.x) / transformation.zoom;
            output.position.bounds.y = (output.position.center[1] * (transformation.zoom - 1) +
                output.position.bounds.y) / transformation.zoom;
        }
    }
    log.debug('Successfully transformed state from:', input, 'to:', output, 'using:', transformation);
    return output;
};

base.operations.canDiff = function (source, target) {
    const getCanDiff = function (state) {
        const combinations = [
            ['state', 'state.center', 'state.resolution'],
            ['state', 'state.position', 'state.position.center', 'state.position.resolution', 'state.position.bounds',
                'state.position.bounds.x', 'state.position.bounds.y', 'state.position.bounds.w',
                'state.position.bounds.h']
        ];

        let canDiff = false;
        combinations.forEach(function (e) {
            let result = true;
            e.forEach(function (x) {
                result = result && !Utils.isNullOrEmpty(Utils.JSON.getDescendant(x, { state: state }));
            });
            canDiff = canDiff || result;
        });
        return canDiff;
    };
    const result = getCanDiff(source) && getCanDiff(target);
    log.debug('Can' + (result ? '' : '\'t') + 'difference source:', source, 'and target:', target);
    return result;
};

base.operations.diff = function (source, target) {
    const s = source.position || source;
    const t = target.position || target;
    const result = {
        zoom: s.resolution / t.resolution,
        pan: {
            x: (t.center[0] - s.center[0]) / s.resolution,
            y: (s.center[1] - t.center[1]) / s.resolution
        }
    };
    log.debug('Successfully computed difference:', result, 'from source:', source, 'to target:', target);
    return result;
};

log.debug('Setting up state validation operation');
base.operations.validateState = function (state) {
    return Utils.validateState(state, [
        {
            value: ['state.position', 'state.position.center', 'state.position.resolution', 'state.position.zoom',
                'state.position.bounds', 'state.position.bounds.x', 'state.position.bounds.y',
                'state.position.bounds.w', 'state.position.bounds.h']
        }
    ]) ||
    Utils.validateState(state, [ { value: ['state.center', 'state.resolution', 'state.zoom'] } ]) ||
    Utils.validateState(state, [ { prefix: ['state.url'] } ]);
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
            log.warn('Attempting to reconnect in ' + Constants.SOCKET_REFRESH_DELAY + 'ms');
            // If the socket is closed, we try to refresh it.
            setTimeout(getSocket, Constants.SOCKET_REFRESH_DELAY);
        });
        socket.on('error', log.error);
        socket.on('message', function (msg) {
            let m = JSON.parse(msg);
            if (m.appId !== Constants.APP_NAME || !m.message || !m.message.name) return;

            if (m.message.name === Constants.Events.EVENT && !m.message.secondary) {
                m.message.uuid = uuid++;
                const message = { name: Constants.Events.UUID, uuid: m.message.uuid, clientId: m.message.clientId };
                ws.safeSend(JSON.stringify({ appId: m.appId, sectionId: m.sectionId, message: message }));
                queue.push(m);
            } else if (m.message.name === Constants.Events.REQUEST_SERVER) {
                request({
                    headers: { 'Content-Type': 'application/json'},
                    url: `http://${Utils.getOVEHost()}/connections/section/${m.sectionId}`,
                    method: 'GET',
                    json: true
                }, (error, res, body) => {
                    if (!error && res.statusCode === 200) {
                        if (!body || !body.section) return;
                        m.message.name = Constants.Events.REQUEST_CLIENT;
                        m.message.secondaryId = m.sectionId;
                        const message = { appId: m.appId, sectionId: body.section.primary.toString(), message: m.message };
                        ws.safeSend(JSON.stringify(message));
                    } else {
                        log.error('an error occurred while requesting details:', error);
                    }
                });
            } else if (m.message.name === Constants.Events.RESPOND_SERVER) {
                if (!m.message.secondaryId) return;
                m.message.name = Constants.Events.RESPOND_CLIENT;
                const message = { appId: m.appId, sectionId: m.message.secondaryId, message: m.message };
                ws.safeSend(JSON.stringify(message));
            }
        });
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
        ws.safeSend(JSON.stringify({ appId: Constants.APP_NAME, sectionId: sectionId, message: message }));
    } else {
        ws.safeSend(JSON.stringify({ appId: Constants.APP_NAME, message: message }));
    }

    res.status(HttpStatus.OK).set(Constants.HTTP_HEADER_CONTENT_TYPE,
        Constants.HTTP_CONTENT_TYPE_JSON).send(JSON.stringify({}));
};

const operationsList = Object.values(Constants.Operation);
app.post('/operation/:name(' + operationsList.join('|') + ')', handleOperation);

const port = process.env.PORT || 8080;
server.listen(port);
log.info(Constants.APP_NAME, 'application started, port:', port);
