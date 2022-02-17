initView = function () {
    OVE.Utils.setOnStateUpdate(updateSession);
    window.ove.context.videos = {};
    if (!$(Constants.VIDEO_CONTAINER).length) {
        $('<div>', { id: Constants.VIDEO_CONTAINER.substring(1) })
            .css('display', 'none').appendTo(Constants.CONTENT_DIV);
        $('<video>', {
            id: Constants.MAIN_VIDEO.substring(1),
            muted: true,
            autoplay: true,
            controls: false
        }).css({ width: '100%', height: '100%', position: 'absolute' }).appendTo(Constants.CONTENT_DIV);
        log.debug('Created video container');
    }
};

loadVideo = function () {
    if (window.ove.context.mainVideoLoader) {
        clearInterval(window.ove.context.mainVideoLoader);
        delete window.ove.context.mainVideoLoader;
    }
    const setMainVideo = function () {
        const mainVideo = $(Constants.MAIN_VIDEO);
        const selectedVideo = $('#' + window.ove.context.videos[window.ove.state.current.connection]);
        if (mainVideo[0].srcObject !== selectedVideo[0].srcObject) {
            mainVideo.fadeOut('fast', () => {
                log.debug('Loading Session:', window.ove.state.current.connection);
                mainVideo[0].srcObject = selectedVideo[0].srcObject;
                mainVideo.fadeIn('fast');
            });
            log.debug('Refreshing viewer');

            // A refresh operation takes place when a player is loaded or when a video is
            // ready to be played. This ensures that proper CSS settings are applied.
            let context = window.ove.context;
            if (context.scale !== 1) {
                $(Constants.CONTENT_DIV).css('transform', 'scale(' + (context.scale + 0.001) + ')');
                setTimeout(function () {
                    $(Constants.CONTENT_DIV).css('transform', 'scale(' + context.scale + ')');
                }, Constants.RESCALE_DURING_REFRESH_TIMEOUT);
            }
        }
    };
    const selectedVideo = $('#' + window.ove.context.videos[window.ove.state.current.connection])[0];
    window.ove.context.mainVideoLoader = setInterval(function () {
        if (selectedVideo && selectedVideo.srcObject) {
            setMainVideo();
            clearInterval(window.ove.context.mainVideoLoader);
            delete window.ove.context.mainVideoLoader;
        }
    }, Constants.LOAD_MAIN_VIDEO_TIMEOUT);
};

changeUserData = function (connection, video) {
    if (arguments.length === 2) {
        window.ove.context.videos[connection.connectionId || connection] = video.id;
    } else if ($('#' + window.ove.context.videos[window.ove.state.current.connection]).length === 0) {
        log.debug('Closing Session:', window.ove.state.current.connection);
        $(Constants.MAIN_VIDEO)[0].srcObject = null;
    }
};

beginInitialization = function () {
    log.debug('Starting viewer initialization');
    OVE.Utils.initView(initView, updateSession, function () {
        let context = window.ove.context;
        const g = window.ove.geometry;
        // Appropriately scaling and positioning the player is necessary.
        context.scale = Math.min(g.section.w / g.w, g.section.h / g.h);
        let width = (g.section.w / context.scale) + 'px';
        let height = (g.section.h / context.scale) + 'px';
        log.debug('Scaling viewer:', context.scale, ', height:', height, ', width:', width);
        if (context.scale === 1) {
            $(Constants.CONTENT_DIV).css({
                zoom: 1,
                transformOrigin: '0% 0%',
                transform: 'translate(-' + g.x + 'px,-' + g.y + 'px)',
                width: width,
                height: height
            });
        } else {
            $(Constants.CONTENT_DIV).css({
                zoom: 1,
                transformOrigin: 100 * g.x / (g.section.w - g.section.w / context.scale) + '% ' +
                                100 * g.y / (g.section.h - g.section.h / context.scale) + '%',
                transform: 'scale(' + context.scale + ')',
                width: width,
                height: height
            });
        }
    });
};
