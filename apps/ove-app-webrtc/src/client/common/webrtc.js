const log = OVE.Utils.Logger(Constants.APP_NAME, Constants.LOG_LEVEL);

$(function () {
    // This is what happens first. After OVE is loaded, either the viewer or controller
    // will be initialized.
    $(document).ready(function () {
        log.debug('Starting application');
        window.ove = new OVE(Constants.APP_NAME);
        log.debug('Completed loading OVE');
        let context = window.ove.context;
        if (!context.isInitialized) {
            const url = context.hostname + '/sections/' + OVE.Utils.getSectionId();
            $.ajax({ url: url, dataType: 'json' }).done(section => {
                context.appUrl = section.app.url;
                context.ov = new OpenVidu();
                log.info('Created OpenVidu Instance');
                context.isInitialized = true;
            });
        }
        beginInitialization();
    });
});

updateSession = function () {
    let context = window.ove.context;
    let state = window.ove.state.current;
    if (state.sessionActive && !context.session) {
        log.debug('Activating Session:', state.sessionId);
        context.session = context.ov.initSession();
        context.session.on(Constants.Event.STREAM_CREATED, event => {
            const subscriber = context.session.subscribe(event.stream, Constants.VIDEO_CONTAINER.substring(1));
            log.debug('Created subscriber');
            subscriber.on(Constants.Event.VIDEO_ELEMENT_CREATED, event => {
                changeUserData(subscriber.stream.connection, event.element);
            });
        });
        context.session.on(Constants.Event.STREAM_DESTROYED, event => {
            changeUserData(event.stream.connection);
        });

        const username = (OVE.Utils.getViewId() || OVE.Utils.getSpace()) + '_user';
        $.ajax({ url: context.appUrl + '/operation/token?sessionId=' + state.sessionId + '&username=' + username, dataType: 'json' }).done(token => {
            context.session.connect(token, { clientData: username }).then(() => {
                log.info('Activated Session:', state.sessionId, 'username:', username);
                $(Constants.NOTICE).html('<strong>Session ID:</strong> ' + state.sessionId);
            });
        });
    } else if (!state.sessionActive && context.session) {
        window.ove.context.session.disconnect();
        delete window.ove.context.session;
        log.info('Stopped Session:', state.sessionId);
        changeUserData();
    } else if (window.ove.state.current.connection) {
        loadVideo();
    }
};
