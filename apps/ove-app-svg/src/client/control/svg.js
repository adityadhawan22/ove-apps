initControl = function (data) {
    window.ove.context.isInitialized = false;
    log.debug('Application is initialized:', window.ove.context.isInitialized);
    log.debug('Restoring state:', data);
    window.ove.state.current = data;

    // If a URL was passed, the URL of the loaded state is overridden.
    // Note that state is synchronised by the Tuoris service, rather than being broadcast
    // directly to the viewers.
    let url = OVE.Utils.getURLQueryParam();
    if (url) {
        log.debug('New URL at controller:', url);
        window.ove.state.current.url = url;
    } else {
        url = data.url;
    }
    log.debug('Caching state');
    window.ove.state.cache();

    loadSVGFrame();
    log.info('Loading URL:', url);
    $.get({ url: '//' + Constants.TUORIS_HOST + '/command?mount=' + url }).done(function () {
        setTimeout(function () {
            $(Constants.SVG_FRAME).attr('src', '//' + Constants.TUORIS_HOST + '/control/');
            window.ove.context.isInitialized = true;
            log.debug('Application is initialized:', window.ove.context.isInitialized);
            window.ove.socket.send({ refreshClients: true });
        }, Constants.TUORIS_LOAD_DELAY);
    }).catch(log.error);
};

getCSS = function () {
    // Unlike most apps, the SVG app's controller renders the HTML page at a fixed
    // height and width.
    return { width: '100vw', height: '60vh' };
};

beginInitialization = function () {
    log.debug('Starting controller initialization');
    OVE.Utils.initControl(Constants.DEFAULT_STATE_NAME, initControl);
};
