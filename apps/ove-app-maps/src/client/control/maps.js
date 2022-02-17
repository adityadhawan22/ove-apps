initControl = async function (data) {
    const context = window.ove.context;
    context.isInitialized = false;
    log.debug('Application is initialized:', window.ove.context.isInitialized);

    const g = window.ove.geometry;
    OVE.Utils.resizeController('.map, .outer');
    if (data.url) {
        window.ove.state.current.url = data.url;
    }

    OVE.Utils.setOnStateUpdateController(() => {
        const p = window.ove.state.current.position;
        log.debug('Updating map with zoom:', p.zoom, ', center:', p.center, ', and resolution:', p.resolution);
        context.updateFlag = true;
        context.library.setZoom(p.zoom);
        context.library.setCenter(p.center);
        context.updateFlag = false;
    });

    await initCommon();
    // We make sure both controller and viewer have received their layers
    OVE.Utils.broadcastState();
    if (context.layers.length === 0) {
        log.fatal('Map layers not available. Cannot load application');
        return;
    }
    const enabledLayers = OVE.Utils.getQueryParam('layers', '0').split(',');
    if (window.ove.state.current.position && enabledLayers !== window.ove.state.current.enabledLayers) {
        // If the layers have changed, clear the cached position to force a broadcast.
        window.ove.state.current.position = null;
    }
    window.ove.state.current.enabledLayers = enabledLayers;
    // Make enabled layers visible.
    window.ove.state.current.enabledLayers.forEach(function (e) {
        log.debug('Setting visible for layer:', e);
        context.library.showLayer(context.layers[e]);
    });
    if (data.scripts && data.scripts.length !== 0) {
        const first = $('script:first');
        data.scripts.forEach(function (e) {
            $('<script>', { src: e }).insertBefore(first);
        });
        window.ove.state.current.scripts = data.scripts;
    }

    const config = {
        center: data.center,
        resolution: data.resolution,
        zoom: data.zoom
    };

    const loadMap = function () {
        // The resolution can be scaled to match the section's dimensions, or it could be
        // the original resolution intended for the controller. The data.scaled property
        // is used to determine the option.
        const outer = $('.outer');
        const scaleFactor = (data.scaled ? Math.sqrt(g.section.w * g.section.h /
            (parseInt(outer.css('width'), 10) * parseInt(outer.css('height'), 10))) : 1.0);
        const resolution = config.resolution ? +(config.resolution) * scaleFactor : undefined;
        const zoom = config.resolution ? +(config.zoom) : (+(config.zoom) - Math.log2(scaleFactor));
        context.map = context.library.initialize({
            center: [+(config.center[0]), +(config.center[1])],
            resolution: resolution,
            zoom: zoom,
            enableRotation: false
        });
        // We force the setting of the zoom.
        context.library.setZoom(zoom);
        uploadMapPosition();
        context.isInitialized = true;
        context.library.registerHandlerForEvents(uploadMapPosition, () => { return window.ove.context.updateFlag; });
    };

    let url = OVE.Utils.getURLQueryParam();
    if (!url) {
        // If not, the URL could also have been provided as a part of the state configuration.
        // We don't care to test if 'data.url' was set or not, since it will be tested below
        // anyway.
        url = data.url;
    }
    if (url) {
        log.debug('Loading configuration from URL:', url);
        $.ajax({ url: url, dataType: 'json' }).always(function (data) {
            config.center = data.center || config.center;
            config.resolution = data.resolution || config.resolution;
            config.zoom = data.zoom || config.zoom;
            log.debug('Using center:', config.center, 'resolution:', config.resolution, 'and zoom:', config.zoom);
            loadMap();
        });
    } else {
        loadMap();
    }
};

uploadMapPosition = function () {
    const context = window.ove.context;
    const size = context.library.getSize();
    const topLeft = context.library.getTopLeft();
    const bottomRight = context.library.getBottomRight();

    // If the resolution is not available, the scaling factor will be applied to zoom, instead.
    const scaleFactor = Math.sqrt(window.ove.geometry.section.w * window.ove.geometry.section.h / (size[0] * size[1]));
    const zoom = context.library.getResolution() ? context.library.getZoom() : (context.library.getZoom() + Math.log2(scaleFactor));
    const resolution = context.library.getResolution() ? context.library.getResolution() / scaleFactor : undefined;
    if (topLeft === null || bottomRight === null) {
        log.debug('Waiting to get coordinates from pixels');
        // This method will loop until the top-left and bottom-right can be calculated.
        setTimeout(uploadMapPosition, 70);
        return;
    }
    // We broadcast the coordinates of the center, the zoom level and the resolution.
    // We also send the coordinates of the top-left and bottom-right, to ensure the
    // map is focusing on the correct lat/long.
    const position = {
        bounds: {
            x: topLeft[0],
            y: topLeft[1],
            w: bottomRight[0] - topLeft[0],
            h: bottomRight[1] - topLeft[1]
        },
        center: context.library.getCenter(),
        resolution: resolution,
        zoom: zoom
    };

    // The broadcast happens only if the position has changed.
    if (!window.ove.state.current.position ||
        !OVE.Utils.JSON.equals(position, window.ove.state.current.position)) {
        window.ove.state.current.position = position;
        log.debug('Broadcasting state with position:', position);
        OVE.Utils.broadcastState();
    }
};

beginInitialization = function () {
    $(document).on(OVE.Event.LOADED, function () {
        log.debug('Invoking OVE.Event.Loaded handler');
        // The maps controller can pre-load an existing state and continue navigation
        // from that point onwards and does not reset what's already loaded.
        window.ove.state.load().then(function () {
            if (window.ove.state.current.position) {
                const p = window.ove.state.current.position;
                log.debug('Successfully loaded state and found position');
                const data = { center: p.center, resolution: p.resolution, zoom: p.zoom, scaled: true };
                log.debug('Initializing controller with config:', data);
                $(window).resize(function () {
                    location.reload();
                });
                initControl(data);
            } else if (window.ove.state.current.url) {
                const url = window.ove.state.current.url;
                log.debug('Attempting to load state from url:', url);
                const data = { url: url };
                log.debug('Initializing controller with config:', data);
                $(window).resize(function () {
                    location.reload();
                });
                initControl(data);
            } else {
                log.debug('State loaded successfully, but position details not set - loading default state');
                // There could be a situation where a current state exists but without a position.
                OVE.Utils.initControlOnDemand(Constants.DEFAULT_STATE_NAME, initControl);
            }
        }).catch(function () {
            log.debug('State load failed - loading default state');
            // If the promise is rejected, that means no current state is existing.
            OVE.Utils.initControlOnDemand(Constants.DEFAULT_STATE_NAME, initControl);
        });
    });
};
