const log = OVE.Utils.Logger(Constants.APP_NAME, Constants.LOG_LEVEL);

$(function () {
    // This is what happens first. After OVE is loaded, either the viewer or controller
    // will be initialized. The viewer or controller has the freedom to call the initCommon
    // at any point. Application specific context variables are also initialized at this point.
    $(document).ready(function () {
        log.debug('Starting application');
        window.ove = new OVE(Constants.APP_NAME);
        log.debug('Completed loading OVE');
        const context = window.ove.context;
        context.isInitialized = false;
        context.currentUUID = -1;
        context.updateFlag = false;
        context.layers = [];
        context.map = undefined;
        beginInitialization();
    });
});

const buildViewport = function (op, context) {
    switch (op.name) {
        case Constants.Operation.PAN:
            context.library.setCenter([op.x, op.y]);
            break;
        case Constants.Operation.ZOOM:
            context.library.setZoom(op.zoom);
            break;
        default:
            log.warn('Ignoring unknown operation:', op.name);
            break;
    }
};

// Initialization that is common to viewers and controllers.
/* jshint ignore:start */
// current version of JSHint does not support async/await
initCommon = async function (onUpdate, updateState) {
    const context = window.ove.context;
    const state = window.ove.state.current;

    const loadLayers = async function (layers) {
        if (layers.length === 0 || layers[0].type.indexOf('ol.') === 0) {
            context.library = new window.OVEOpenLayersMap();
        } else {
            context.library = new window.OVELeafletMap();
        }

        context.layers = await context.library.loadLayers(layers);
    };

    window.ove.socket.on(function (message) {
        if (!message || !context.isInitialized) return;
        const uuid = window.ove.context.uuid;

        if (message.name) {
            if (message.name === Constants.Events.UUID && window.ove.context.currentUUID < message.uuid && message.clientId === uuid) {
                window.ove.context.currentUUID = message.uuid;
            } else if (message.name === Constants.Events.UPDATE && !message.secondary) {
                if (window.ove.context.uuid === message.clientId) return;
                if (message.uuid <= window.ove.context.currentUUID) return;
                window.ove.context.currentUUID = message.UUID;
                onUpdate(message, false);
            } else if (message.name === Constants.Events.UPDATE && message.secondary) {
                onUpdate(message, true);
            } else if (message.name === Constants.Events.REQUEST_CLIENT) {
                const m = { name: Constants.Events.RESPOND_SERVER, position: window.ove.state.current.position, secondaryId: message.secondaryId };
                window.ove.socket.send(m);
            } else if (message.name === Constants.Events.RESPOND_CLIENT) {
                onUpdate(message, true);
            }
        } else if (message.operation) {
            log.debug('Got invoke operation request: ', message.operation);
            const op = message.operation;

            setTimeout(function () {
                buildViewport(op, context);
            });
        } else {
            updateState(message);
        }
    });

    log.debug('Starting to fetch map layer configurations');
    // The map layer configuration can be specified as a URL
    if (state && state.url) {
        return fetch(state.url).then(r => r.text()).then(async text => {
            const config = JSON.parse(text);
            if (config.layers) {
                log.debug('Loading map configuration from URL:', state.url);
                loadLayers(config.layers);
            } else {
                return fetch('layers.json').then(r => r.text()).then(async text => {
                    log.debug('Parsing map layer configurations');
                    loadLayers(JSON.parse(text));
                });
            }
        });
    }
    return fetch('layers.json').then(r => r.text()).then(async text => {
        log.debug('Parsing map layer configurations');
        loadLayers(JSON.parse(text));
    });
};
/* jshint ignore:end */
