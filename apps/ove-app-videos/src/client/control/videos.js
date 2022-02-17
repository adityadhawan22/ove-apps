initControl = function (data) {
    window.ove.context.isInitialized = false;
    log.debug('Application is initialized:', window.ove.context.isInitialized);
    initCommon();
    log.debug('Restoring state:', data);
    window.ove.state.current = data;
    const url = OVE.Utils.getURLQueryParam();
    if (url) {
        log.debug('New URL at controller:', url);
        // If a URL was passed, the URL of the loaded state would be overridden.
        window.ove.state.current.url = url;
    }
    loadURL();
    waitForBufferComplete().then(loadControls);
};

waitForBufferComplete = function () {
    return new Promise(function (resolve) {
        let counter = 0;
        const x = setInterval(function () {
            counter++;
            if ($(Constants.WAITING_MSG).is(':hidden') ||
                counter === (Constants.SHOW_CONTROLLER_AFTER_DURATION /
                    Constants.WAIT_FOR_BUFFERING_DURATION) | 0) {
                clearInterval(x);
                resolve('buffering complete');
            }
        }, Constants.WAIT_FOR_BUFFERING_DURATION);
    });
};

refresh = function () { }; // View-only operation

requestRegistration = function () {
    // Broadcast a registration request along with a state update such that viewers
    // then replicate the state.
    log.debug('Sending registration request and broadcasting state');
    window.ove.socket.send({ bufferStatus: { type: { requestRegistration: true } } });
    OVE.Utils.broadcastState({ state: window.ove.state.current });
};

displayWaitingMessage = function () {
    $(Constants.WAITING_MSG).text('Waiting for viewers to load');
};

doRegistration = function () { }; // View-only operation

beginInitialization = function () {
    log.debug('Starting controller initialization');
    OVE.Utils.initControl(Constants.DEFAULT_STATE_NAME, initControl);
};

loadControls = function () {
    log.debug('Displaying controller');
    const scale = Math.min(Math.min(document.documentElement.clientWidth, window.innerWidth) / 1440,
        Math.min(document.documentElement.clientHeight, window.innerHeight) / 720);
    $(Constants.CONTROLLER).css({ display: 'block', transformOrigin: '50% 50%', transform: 'scale(' + scale + ')' });

    $(Constants.Button.PLAY).click(function () {
        if (!$(Constants.Button.PLAY).hasClass(Constants.State.ACTIVE)) {
            $(Constants.Button.PLAY).addClass(Constants.State.ACTIVE);
            $(Constants.Button.STOP).addClass(Constants.State.ACTIVE);
            $.ajax({
                url: window.ove.context.appUrl + '/operation/play' +
                    '?oveSectionId' + OVE.Utils.getSectionId(),
                type: 'POST',
                data: {},
                contentType: 'application/json'
            }).catch(log.error);
        } else {
            $(Constants.Button.PLAY).removeClass(Constants.State.ACTIVE);
            $.ajax({
                url: window.ove.context.appUrl + '/operation/pause' +
                    '?oveSectionId' + OVE.Utils.getSectionId(),
                type: 'POST',
                data: {},
                contentType: 'application/json'
            }).catch(log.error);
        }
    });

    $(Constants.Button.MUTE).click(function () {
        if (!$(Constants.Button.MUTE).hasClass(Constants.State.ACTIVE)) {
            $(Constants.Button.MUTE).addClass(Constants.State.ACTIVE);
            $.ajax({
                url: window.ove.context.appUrl + '/operation/mute?mute=true' +
                    '&oveSectionId' + OVE.Utils.getSectionId(),
                type: 'POST',
                data: {},
                contentType: 'application/json'
            }).catch(log.error);
        } else {
            $(Constants.Button.MUTE).removeClass(Constants.State.ACTIVE);
            $.ajax({
                url: window.ove.context.appUrl + '/operation/mute?mute=false' +
                    '&oveSectionId' + OVE.Utils.getSectionId(),
                type: 'POST',
                data: {},
                contentType: 'application/json'
            }).catch(log.error);
        }
    });

    $(Constants.Button.STOP).click(function () {
        if ($(Constants.Button.STOP).hasClass(Constants.State.ACTIVE)) {
            $(Constants.Button.PLAY).removeClass(Constants.State.ACTIVE);
            $(Constants.Button.STOP).removeClass(Constants.State.ACTIVE);
            $.ajax({
                url: window.ove.context.appUrl + '/operation/stop' +
                    '?oveSectionId' + OVE.Utils.getSectionId(),
                type: 'POST',
                data: {},
                contentType: 'application/json'
            }).catch(log.error);
        }
    });
};
