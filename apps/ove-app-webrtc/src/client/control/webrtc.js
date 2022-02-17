initControl = function (data) {
    window.ove.context.connections = {};
    log.debug('Restoring state:', data);
    window.ove.state.current = data;

    let url = OVE.Utils.getURLQueryParam();
    // If a URL was passed, the sessionId of the loaded state would be overridden.
    if (!url) {
        // If not, the URL could also have been provided as a part of the state configuration.
        // We don't care to test if 'data.url' was set or not, since it will be tested below
        // anyway.
        url = data.url;
    }
    if (url) {
        const sessionId = url.substring(url.lastIndexOf('/') + 1);
        log.debug('New SessionId at controller:', sessionId);
        window.ove.state.current.sessionId = sessionId;
    }

    // Unlike most apps, the WebRTC app's controller renders the video selector
    // height and width.
    $(Constants.CONTENT_DIV).css({ width: '100vw', height: '80vh' });
    loadControls();
    if (!$(Constants.VIDEO_CONTAINER).length) {
        $('<div>', { id: Constants.VIDEO_CONTAINER.substring(1) }).appendTo(Constants.CONTENT_DIV);
        log.debug('Created video container');
    }
};

beginInitialization = function () {
    log.debug('Starting controller initialization');
    $(document).on(OVE.Event.LOADED, function () {
        log.debug('Invoking OVE.Event.Loaded handler');
        OVE.Utils.initControlOnDemand(Constants.DEFAULT_STATE_NAME, initControl);
    });
};

loadVideo = function () {
}; // View-only operation

changeUserData = function (connection, video) {
    const maxSessions = window.ove.state.current.maxSessions || Constants.MAX_SESSION_COUNT;
    const gap = Constants.GAP_BETWEEN_VIDEOS;

    // Loading previews of active sessions on the controller.
    if (arguments.length === 2) {
        const width = parseInt($(Constants.CONTENT_DIV).css('width'), 10);
        const height = parseInt($(Constants.CONTENT_DIV).css('height'), 10);

        let videoWidth = video.videoWidth || 320;
        let videoHeight = video.videoHeight || 240;
        const videos = $(Constants.VIDEO_CONTAINER).children('video');
        for (let i = 0; i < videos.length; i++) {
            videoWidth = Math.max(videoWidth, videos[i].videoWidth);
            videoHeight = Math.max(videoHeight, videos[i].videoHeight);
        }
        log.debug('Computed maximum video width:', videoWidth, 'and height:', videoHeight);

        let ratio;
        const possibleCols = width / (videoWidth + gap);
        const possibleRows = height / (videoHeight + gap);
        if (possibleCols > possibleRows) {
            ratio = Math.floor(possibleCols / possibleRows);
        } else {
            ratio = 1 / Math.floor(possibleRows / possibleCols);
        }
        log.debug('Computed columns to rows ratio:', ratio);

        let dim = {
            c: Math.ceil(Math.sqrt(maxSessions * ratio)),
            r: Math.ceil(Math.sqrt(maxSessions / ratio))
        };
        dim.w = Math.floor(width / dim.c) - gap;
        dim.h = Math.floor(height / dim.r) - gap;
        log.debug('Computed dimensions:', dim);

        let count = $(Constants.VIDEO_CONTAINER).children('video').length;
        if (count > maxSessions) {
            video.remove();
            return;
        }

        let req = {
            c: Math.ceil(Math.sqrt(count * dim.c / dim.r)),
            r: Math.ceil(Math.sqrt(count * dim.r / dim.c))
        };
        log.debug('Computed required columns and rows:', req, ', for videos:', count);

        // We are calculating the top and left margins using the total possible vertical and
        // horizontal margins. We use 50% of the available horizontal margin, which will center
        // the content horizontally. But, we use 80% of the available vertical margin, which
        // moves the content to the bottom of the screen as much as possible.
        const marginX = (gap + width - (dim.w + gap) * req.c) * 0.5;
        const marginY = (gap + height - (dim.h + gap) * req.r) * 0.8;
        log.debug('Computed margins x:', marginX, 'y:', marginY);

        for (let i = 0; i < count; i++) {
            $('#' + $(Constants.VIDEO_CONTAINER).children('video')[i].id).css({
                width: dim.w,
                height: dim.h,
                position: 'absolute',
                marginLeft: marginX + (dim.w + gap) * (i % dim.c),
                marginTop: marginY + (dim.h + gap) * Math.floor(i / dim.r)
            });
        }
        window.ove.context.connections[video.id] = connection.connectionId || connection;
        $('#' + video.id).click(function () {
            $(Constants.VIDEO_CONTAINER).children('video').css('border', '');
            $(this).css('border', Constants.SELECTED_SESSION_BORDER);
            window.ove.state.current.connection = window.ove.context.connections[video.id];
            log.debug('Broadcasting state');
            OVE.Utils.broadcastState();
        });

        // Select at least one session, or else users may assume system is not working
        if ($(Constants.VIDEO_CONTAINER).children('video').length === 1) {
            setTimeout(function () {
                $(Constants.VIDEO_CONTAINER).children('video')[0].click();
            }, Constants.SELECTION_TIMEOUT);
        }
    }
};

loadControls = function () {
    log.debug('Displaying controller');
    const scale = Math.min(Math.min(document.documentElement.clientWidth, window.innerWidth) / 1440,
        Math.min(document.documentElement.clientHeight, window.innerHeight) / 720);
    $(Constants.CONTROLLER).css({ display: 'block', transformOrigin: '50% 50%', transform: 'scale(' + scale + ')' });

    $(Constants.Button.CREATE).click(function () {
        if (!window.ove.state.current.sessionId) {
            window.ove.state.current.sessionId = prompt('Please provide the Session Id');
        }
        if (window.ove.state.current.sessionId && !$(Constants.Button.CREATE).hasClass(Constants.State.INACTIVE)) {
            $(Constants.Button.CREATE).addClass(Constants.State.INACTIVE);
            $(Constants.Button.END).addClass(Constants.State.ACTIVE);
            $(Constants.Background.END).addClass(Constants.State.ACTIVE);
            // If the Session Id was random we generate a 10 character string.
            if (window.ove.state.current.randomSessionId ||
                window.ove.state.current.sessionId.toLowerCase() === Constants.RANDOM_SESSION) {
                const getRandomString = function (length) {
                    const chars = String.fromCharCode.apply(null,
                        Array.from({ length: 26 }, (_v, k) => k + 'A'.charCodeAt()).concat(
                            Array.from({ length: 26 }, (_v, k) => k + 'a'.charCodeAt()))) + '_-';
                    return Array.from({ length: length },
                        () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
                };
                window.ove.state.current.randomSessionId = true;
                window.ove.state.current.sessionId = getRandomString(10);
                log.debug('Generated Session Id:', window.ove.state.current.sessionId);
            }
            window.ove.state.current.sessionActive = true;
            log.debug('OpenVidu section is active:', window.ove.state.current.sessionActive);
            log.debug('Broadcasting state');
            OVE.Utils.broadcastState();
            updateSession();
        }
    });

    $(Constants.Button.END).click(function () {
        if ($(Constants.Button.END).hasClass(Constants.State.ACTIVE)) {
            $(Constants.Button.CREATE).removeClass(Constants.State.INACTIVE);
            $(Constants.Button.END).removeClass(Constants.State.ACTIVE);
            $(Constants.Background.END).removeClass(Constants.State.ACTIVE);
            $(Constants.NOTICE).html('');
            window.ove.state.current.sessionActive = false;
            log.debug('OpenVidu section is active:', window.ove.state.current.sessionActive);
            log.debug('Broadcasting state');
            OVE.Utils.broadcastState();
            updateSession();
        }
    });
};
