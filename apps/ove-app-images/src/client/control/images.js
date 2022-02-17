initControl = function (data, viewport) {
    const context = window.ove.context;
    const __private = {
        viewport: viewport
    };
    context.isInitialized = false;
    log.debug('Application is initialized:', window.ove.context.isInitialized);

    OVE.Utils.setOnStateUpdateController(() =>
        updatePosition(window.ove.state.current, { viewport: window.ove.state.current.viewport }, window.ove.context)());

    initCommon();

    log.debug('URL: ', window.ove.context.appUrl);

    OVE.Utils.resizeController(Constants.CONTENT_DIV);
    // Initially, the state may not be set under the config property, but it will be once
    // the controller sets its state. The difference is for it to be possible to set
    // additional state variables such as viewport information, which is not required for
    // initialising the app.
    const currentState = data.config || data;
    log.debug('Restoring state:', currentState);

    let url = OVE.Utils.getURLQueryParam();
    // If a URL was passed, the tileSources of the loaded state would be overridden.
    if (!url && !currentState.tileSources) {
        // If not, the URL could also have been provided as a part of the state configuration.
        // We don't care to test if 'data.url' was set or not, since it will be tested below
        // anyway.
        url = currentState.url;
    }
    if (url) {
        if (url.endsWith('.dzi')) {
            log.debug('New DZI URL at controller:', url);
            currentState.tileSources = url;
        } else if (url.endsWith('.xml')) {
            log.debug('New XML URL at controller:', url);
            currentState.tileSources = url;
        } else if (url.endsWith('.json')) {
            log.debug('New JSON at controller:', url);
            currentState.tileSources = url;
        } else {
            log.debug('New image URL at controller:', url);
            currentState.tileSources = { type: 'image', url: url };
        }
    }

    window.ove.state.current = { config: currentState };
    // Viewport details would be updated for specific events - check OSD_MONITORED_EVENTS.
    loadOSD(currentState).then(updatePosition(currentState, __private, context)).catch(log.error);
};

sendViewportDetails = function () {
    if (window.ove.context.updateFlag) return;
    const context = window.ove.context;
    if (!context.isInitialized) return;
    const bounds = context.osd.viewport.getBounds();
    // The viewport information sent across includes bounds and zoom level.
    const viewport = {
        bounds: { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height },
        zoom: context.osd.viewport.getZoom(),
        dimensions: { w: window.ove.geometry.section.w, h: window.ove.geometry.section.h }
    };

    // Viewport details are only sent across only if they have changed. This is
    // validated by checking the current state.
    if (window.ove.state.current.viewport && OVE.Utils.JSON.equals(viewport, window.ove.state.current.viewport)) return;
    window.ove.state.current.viewport = viewport;

    if (window.ove.state.name) {
        // Keep track of loaded state: this is used to check if the controller
        // is attempting to load a different state.
        window.ove.state.current.loadedState = window.ove.state.name;
    }
    log.debug('Broadcasting state with viewport:', window.ove.state.current.viewport);
    OVE.Utils.broadcastState();
};

updatePosition = function (state, wrapper, context) {
    const setupHandlers = function () {
        for (const e of Constants.OSD_MONITORED_EVENTS) {
            log.debug('Registering OpenSeadragon handler:', e);
            context.osd.addHandler(e, sendViewportDetails);
        }
        context.isInitialized = true;
        log.debug('Application is initialized:', context.isInitialized);
        sendViewportDetails();
    };

    const update = function () {
        const bounds = wrapper.viewport.bounds;
        const calcX = Number(bounds.x) + Number(bounds.w) * 0.5;
        const calcY = Number(bounds.y) + Number(bounds.h) * 0.5;
        context.osd.viewport.panTo(new OpenSeadragon.Point(calcX,
            calcY), true).zoomTo(wrapper.viewport.zoom);

        if (!context.osd.isVisible()) {
            setTimeout(function () {
                // Wait further for OSD to re-center and zoom image.
                log.debug('Making OpenSeadragon visible');
                context.osd.setVisible(true);
            }, Constants.OSD_POST_LOAD_WAIT_TIME);
        }
        setupHandlers();
    };

    return function () {
        if (wrapper.viewport && wrapper.viewport.bounds) {
            // Delaying visibility to support better loading experience.
            log.debug('Making OpenSeadragon hidden');
            context.osd.setVisible(false);

            setTimeout(function () {
                window.ove.context.updateFlag = true;
                update(); // Wait sufficiently for OSD to load the image for the first time.
                window.ove.context.updateFlag = false;
            }, Constants.OSD_POST_LOAD_WAIT_TIME);
        } else {
            setupHandlers();
        }
    };
};

beginInitialization = function () {
    log.debug('Starting controller initialization');
    $(document).on(OVE.Event.LOADED, function () {
        log.debug('Invoking OVE.Event.Loaded handler');
        // The images controller can pre-load an existing state and continue navigation
        // from that point onwards and does not reset what's already loaded.
        window.ove.state.load().then(function () {
            const currentState = window.ove.state.current;
            const loadingNewState = currentState.loadedState !== undefined && window.ove.state.name !== null &&
                currentState.loadedState !== window.ove.state.name;
            if (!loadingNewState && currentState && currentState.viewport) {
                // This happens when the image has been pre-loaded by a controller and
                // the viewport information is already available.
                log.debug('Initializing controller with state:', currentState,
                    'and viewport:', currentState.viewport);
                $(window).resize(function () {
                    location.reload();
                });
                initControl(currentState, currentState.viewport);
            } else if (currentState && !currentState.viewport) {
                // This is when an image state has been pre-loaded and the controller is
                // attempting to load the image for the first time. We don't care if the
                // state was existing or not at this point.
                log.debug('Initializing controller with state:', currentState);
                $(window).resize(function () {
                    location.reload();
                });
                initControl(currentState);
            } else {
                // There could be a situation where a current state exists but without
                // required configuration, or the controller is attempting to load a new
                // state altogether.
                log.debug('Incomplete state information - loading default state');
                OVE.Utils.initControlOnDemand(Constants.DEFAULT_STATE_NAME, initControl);
            }
        }).catch(function () {
            log.debug('State load failed - loading default state');
            // If the promise is rejected, that means no current state is existing.
            OVE.Utils.initControlOnDemand(Constants.DEFAULT_STATE_NAME, initControl);
        });
    });
};
