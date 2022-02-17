initView = function () {
    let context = window.ove.context;
    context.isInitialized = false;
    context.isCommonInitialized = false;
    log.debug('Application is initialized:', context.isInitialized && context.isCommonInitialized);
    OVE.Utils.setOnStateUpdate(initThenUpdateMap);
};

initThenUpdateMap = function () {
    if (!window.ove.context.isCommonInitialized) {
        window.ove.context.isCommonInitialized = true;
        initCommon().then(updateMap);
    } else {
        updateMap();
    }
};

updateMap = function () {
    const context = window.ove.context;
    if (!context.library) {
        log.warn('Mapping library not loaded');
        return;
    }
    const g = window.ove.geometry;
    // This check is required since the state may not be loaded when the viewer
    // receives a state update.
    if (Object.keys(g).length === 0) {
        log.debug('State not fully loaded - retrying');
        return;
    }
    const p = window.ove.state.current.position;
    if (!p) {
        return;
    }
    const center = [+(p.bounds.x) + (p.bounds.w * (0.5 * g.w + g.x) / g.section.w),
        +(p.bounds.y) + (p.bounds.h * (0.5 * g.h + g.y) / g.section.h)];
    // Unlike in the controller, all layers will be explicitly shown or hidden based
    // on whether they have been enabled.
    context.layers.forEach(function (e, i) {
        const visible = window.ove.state.current.enabledLayers.includes(i.toString());
        if (visible) {
            context.library.showLayer(e);
        } else {
            context.library.hideLayer(e);
        }
        if (visible) {
            log.debug('Setting visible for layer:', i);
        }
    });
    // Initialization of maps requires center, resolution and a zoom level.
    // If the map has already been initialized what changes is the center and/or the
    // resolution.
    if (!context.isInitialized) {
        const scripts = window.ove.state.current.scripts;
        if (scripts && scripts.length !== 0) {
            const first = $('script:first');
            scripts.forEach(function (e) {
                $('<script>', { src: e }).insertBefore(first);
            });
        }
        context.map = context.library.initialize({
            center: center,
            resolution: +(p.resolution),
            zoom: +(p.zoom),
            enableRotation: false });
        context.isInitialized = true;
        log.debug('Application is initialized:', context.isInitialized && context.isCommonInitialized);
        return;
    } else if (!context.map) {
        return;
    }
    log.debug('Updating map with zoom:', +(p.zoom), ', center:', center, ', and resolution:', +(p.resolution));
    context.library.setZoom(+(p.zoom));
    context.library.setCenter(center);
    context.library.setResolution(+(p.resolution));
};

beginInitialization = function () {
    log.debug('Starting viewer initialization');
    OVE.Utils.initView(initView, initThenUpdateMap);
    // BACKWARDS-COMPATIBILITY: For <= v0.4.1
    if (!Constants.Frame.PARENT) {
        Constants.Frame.PARENT = 'parent';
    }
    // Cull occluded sections
    setTimeout(function () {
        window.ove.frame.send(Constants.Frame.PARENT, { cull: { sectionId: OVE.Utils.getSectionId() } }, 'core');
    }, Constants.FRAME_LOAD_DELAY);
};
