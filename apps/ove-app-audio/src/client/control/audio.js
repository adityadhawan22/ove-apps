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
    loadControls();
};

refresh = function () {
}; // View-only operation

requestRegistration = function () {
    // Broadcast a registration request along with a state update such that viewers
    // then replicate the state.
    log.debug('Sending registration request and broadcasting state');
    window.ove.socket.send({ bufferStatus: { type: { requestRegistration: true } } });
    OVE.Utils.broadcastState({ state: window.ove.state.current });
};

const _stopControl = () => {
    if (!$(Constants.Button.STOP).hasClass(Constants.State.ACTIVE)) return;
    $(Constants.Button.PLAY).removeClass(Constants.State.ACTIVE);
    $(Constants.Button.STOP).removeClass(Constants.State.ACTIVE);
    $.ajax({
        url: window.ove.context.appUrl + '/operation/stop' +
            '?oveSectionId' + OVE.Utils.getSectionId(),
        type: 'POST',
        data: {},
        contentType: Constants.HTTP_CONTENT_TYPE_JSON
    }).catch(log.error);
};

const _muteControl = () => {
    const isActive = $(Constants.Button.MUTE).hasClass(Constants.State.ACTIVE);
    if (isActive) {
        $(Constants.Button.MUTE).removeClass(Constants.State.ACTIVE);
    } else {
        $(Constants.Button.MUTE).addClass(Constants.State.ACTIVE);
    }
    $.ajax({
        url: window.ove.context.appUrl + '/operation/mute?mute=' + !isActive +
            '&oveSectionId' + OVE.Utils.getSectionId(),
        type: 'POST',
        data: {},
        contentType: Constants.HTTP_CONTENT_TYPE_JSON
    }).catch(log.error);
};

const _playControl = () => {
    const isActive = $(Constants.Button.PLAY).hasClass(Constants.State.ACTIVE);
    if (isActive) {
        $(Constants.Button.PLAY).removeClass(Constants.State.ACTIVE);
    } else {
        $(Constants.Button.PLAY).addClass(Constants.State.ACTIVE);
        $(Constants.Button.STOP).addClass(Constants.State.ACTIVE);
    }
    $.ajax({
        url: window.ove.context.appUrl + '/operation/' + (isActive ? 'pause' : 'play') +
            '?oveSectionId' + OVE.Utils.getSectionId(),
        type: 'POST',
        data: {},
        contentType: Constants.HTTP_CONTENT_TYPE_JSON
    }).catch(log.error);
};

loadControls = function () {
    log.debug('Displaying controller');
    const scale = Math.min(Math.min(document.documentElement.clientWidth, window.innerWidth) / 1440,
        Math.min(document.documentElement.clientHeight, window.innerHeight) / 720);
    log.debug('scale: ', scale);
    log.debug('controller is found: ', $(Constants.CONTROLLER) !== undefined);
    $(Constants.CONTROLLER).css({ display: 'block', transformOrigin: '50% 50%', transform: 'scale(' + scale + ')' });

    $(Constants.Button.PLAY).click(_playControl);
    $(Constants.Button.MUTE).click(_muteControl);
    $(Constants.Button.STOP).click(_stopControl);
};

doRegistration = function () {
}; // View-only operation

beginInitialization = function () {
    log.debug('Starting controller initialization');
    OVE.Utils.initControl(Constants.DEFAULT_STATE_NAME, initControl);
};
