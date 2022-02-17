initControl = function (data) {
    window.ove.context.isInitialized = false;
    log.debug('Application is initialized:', window.ove.context.isInitialized);

    OVE.Utils.resizeController(Constants.CONTENT_DIV);
    log.debug('Restoring state:', data);
    window.ove.state.current = data;

    OVE.Utils.setOnStateUpdateController(() => {
        window.ove.context.updateFlag = true;
        window.ove.context.sigma.camera.goTo(window.ove.state.current.coordinates);
        refreshSigma(window.ove.context.sigma);
    });

    let url = OVE.Utils.getURLQueryParam();
    // If a URL was passed, the URLs of the loaded state would be overridden.
    if (!url && !data.jsonURL && !data.gexfURL) {
        // If not, the URL could also have been provided as a part of the state configuration.
        // We don't care to test if 'data.url' was set or not, since it will be tested below
        // anyway.
        url = data.url;
    }
    if (url && (url.endsWith('.json') || url.endsWith('.gexf'))) {
        if (url.endsWith('.json')) {
            log.debug('New jsonURL at controller:', url);
            window.ove.state.current.jsonURL = url;
        } else {
            log.debug('New gexfURL at controller:', url);
            // The jsonURL will take precedence if it exists, so it must be unset before a
            // gexfURL can be set.
            if (window.ove.state.current.jsonURL) {
                delete window.ove.state.current.jsonURL;
            }
            window.ove.state.current.gexfURL = url;
        }
    }

    loadSigma();
    log.debug('Broadcasting state');
    OVE.Utils.broadcastState();
    window.ove.socket.addEventListener('message', function (message) {
        if (!window.ove.context.isInitialized || !message) return;
        // We first of all need to know if the operation was known
        if (!Object.values(Constants.Operation).includes(message.operation)) {
            // This can only happen due to a user error
            log.warn('Ignoring unknown operation:', message.operation);
            return;
        }

        runOperation(message);
        if (message.operation === Constants.Operation.RESET) {
            if (window.ove.state.current.operation) {
                delete window.ove.state.current.operation;
            }
        } else {
            window.ove.state.current.operation = message;
        }
        // Cache state for later use.
        window.ove.state.cache();
    });
};

getClientSpecificURL = function (url) {
    return url; // View-only operation
};

setupCoordinatesUpdateEventListener = function (sigma) {
    const horizontalScalingFactor = window.ove.geometry.section.w /
        Math.min(document.documentElement.clientWidth, window.innerWidth);
    const verticalScalingFactor = window.ove.geometry.section.h /
        Math.min(document.documentElement.clientHeight, window.innerHeight);
    const factor = Math.max(horizontalScalingFactor, verticalScalingFactor);
    log.debug('Calculated scaling factor:', factor);

    // Camera position changes trigger COORDINATES_UPDATED_EVENT
    const camera = sigma.camera;
    camera.bind(Constants.COORDINATES_UPDATED_EVENT, function () {
        window.ove.context.coordinates = {
            x: camera.x * factor,
            y: camera.y * factor,
            ratio: camera.ratio,
            angle: camera.angle
        };
    });
    // We want to reduce the high volume of events
    setInterval(function () {
        if (window.ove.context.coordinates &&
            !OVE.Utils.JSON.equals(window.ove.context.coordinates, window.ove.state.current.coordinates)) {
            window.ove.state.current.coordinates = window.ove.context.coordinates;
            OVE.Utils.broadcastState();
            window.ove.context.updateFlag = false;
        }
    }, Constants.COORDINATES_UPDATE_TIMEOUT);
    log.debug('Registered coordinates update event listener');
};

beginInitialization = function () {
    log.debug('Starting controller initialization');
    OVE.Utils.initControl(Constants.DEFAULT_STATE_NAME, initControl);
};
