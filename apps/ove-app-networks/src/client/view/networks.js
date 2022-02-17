initView = function () {
    const context = window.ove.context;
    context.isInitialized = false;
    log.debug('Application is initialized:', window.ove.context.isInitialized);
    window.ove.socket.on(function (message) {
        if (message.operation) {
            // We first of all need to know if the operation was known
            if (!Object.values(Constants.Operation).includes(message.operation)) {
                // This can only happen due to a user error
                log.warn('Ignoring unknown operation:', message.operation);
                return;
            }

            runOperation(message);
        } else {
            if (!OVE.Utils.JSON.equals(message, window.ove.state.current)) {
                if (window.ove.state.current && message.coordinates &&
                    !OVE.Utils.JSON.equals(message.coordinates, window.ove.state.current.coordinates)) {
                    window.ove.state.current = message;
                    if (!window.ove.state.current.neo4j || window.ove.state.current.neo4j.disableTiling) {
                        // Pan or Zoom operations will not happen if Tiling of graphs is enabled (as of now)
                        context.sigma.camera.goTo(window.ove.state.current.coordinates);
                    }
                } else {
                    window.ove.state.current = message;
                    loadSigma();
                }
            }
        }
    });
};

getClientSpecificURL = function (url) {
    // Fix for chrome unable to load large images (#54)
    let csURL = url + '?nonce=' + OVE.Utils.getViewId();
    log.debug('Using client-specific URL:', csURL);
    return csURL;
};

setupCoordinatesUpdateEventListener = function () {}; // Control-only operation

beginInitialization = function () {
    log.debug('Starting viewer initialization');
    OVE.Utils.initView(initView, loadSigma, function () {
        const g = window.ove.geometry;
        const css = {
            width: g.w + 'px',
            height: g.h + 'px'
        };
        log.debug('Resizing viewer with height:', css.height, ', width:', css.width);
        $(Constants.CONTENT_DIV).css(css);
    });
};
