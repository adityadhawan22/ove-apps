initView = () => {
    window.ove.context.isInitialized = false;
    log.debug('Application is initialized:', window.ove.context.isInitialized);

    initCommon();

    const broadcastBufferStatus = () => {
        try {
            const context = window.ove.context;
            // We are doing nothing if the player is not initialized or if
            // no video is loaded as yet.
            if (!context.player || !context.player.isVideoLoaded()) return;

            // The status update includes a UUID that is unique to this peer
            // along with a loaded percentage. Updates are broadcast as per
            // BUFFER_STATUS_BROADCAST_FREQUENCY.
            const status = {
                type: { update: true },
                clientId: context.uuid,
                percentage: context.player.getLoadedPercentage(),
                duration: context.player.getLoadedDuration()
            };

            // If the buffer status does not change compared to the last update
            // there is no point in broadcasting it - simply ignore and proceed.
            if (OVE.Utils.JSON.equals(status, context.bufferStatus.self)) return;

            log.debug('Broadcasting and updating buffer status:', status);

            // The status change is handled locally as well.
            handleBufferStatusChange(status);
            window.ove.socket.send({ bufferStatus: status });
            context.bufferStatus.self = status;
        } catch (e) { } // Random player errors
        setTimeout(broadcastBufferStatus, Constants.BUFFER_STATUS_BROADCAST_FREQUENCY);
    };

    const broadcastPosition = () => {
        try {
            const context = window.ove.context;
            // We are doing nothing if the player is not initialized or if
            // no video is loaded as yet.
            if (!context.player || !context.player.isVideoLoaded()) return;

            // The position update includes a UUID that is unique to this peer
            // along with the current position of the video. Updates are broadcast
            // as per POSITION_BROADCAST_FREQUENCY.
            const position = {
                clientId: context.uuid,
                position: Math.round(context.player.getCurrentTime() * 1000),
                time: window.ove.clock.getTime()
            };

            // If the position does not change compared to the last update there
            // is no point in broadcasting it - simply ignore and proceed. Stuck
            // videos will not cause other videos to stop until they start playing
            // once again. This helps deal with frozen screens and also situations
            // where the playback has been paused.
            if (!context.sync.self || (position.position !== context.sync.self.position &&
                (position.time - context.sync.self.time - position.position +
                    context.sync.self.position >= 500 / Constants.POSITION_SYNC_ACCURACY))) {
                log.debug('Broadcasting and updating position:', position);

                // The status sync is handled locally as well.
                handlePositionSync(position);
                window.ove.socket.send({ sync: position });
                context.sync.self = position;
            } else if (position.position !== context.sync.self.position) {
                context.sync.self = position;
            }
        } catch (e) { } // Random player errors
        setTimeout(broadcastPosition, Constants.POSITION_BROADCAST_FREQUENCY);
    };

    setTimeout(broadcastBufferStatus, Constants.BUFFER_STATUS_BROADCAST_FREQUENCY);
    setTimeout(broadcastPosition, Constants.POSITION_BROADCAST_FREQUENCY);
};

refresh = () => {
    log.debug('Refreshing viewer');

    // A refresh operation takes place when a player is loaded or when a video is
    // ready to be played. This ensures that proper CSS settings are applied.
    const context = window.ove.context;
    if (context.scale === 1) return;

    $(Constants.CONTENT_DIV).css('transform', 'scale(' + (context.scale + 0.001) + ')');
    setTimeout(function () {
        $(Constants.CONTENT_DIV).css('transform', 'scale(' + context.scale + ')');
    }, Constants.RESCALE_DURING_REFRESH_TIMEOUT);
};

requestRegistration = () => {
    log.debug('Requesting registration');

    // This is when a viewer triggers a registration request.
    const status = { type: { requestRegistration: true } };
    handleBufferStatusChange(status);
    window.ove.socket.send({ bufferStatus: status });
};

displayWaitingMessage = () => {};

doRegistration = () => {
    const context = window.ove.context;

    // Only viewers respond to registration requests. Controllers don't respond to this.
    const status = { type: { registration: true }, clientId: context.uuid };
    handleBufferStatusChange(status);
    window.ove.socket.send({ bufferStatus: status });

    // The buffer status of this viewer will be reset such that the broadcastBufferStatus
    // function can then kick in.
    log.debug('Resetting buffer status of viewer');
    context.bufferStatus.self = {};
};

beginInitialization = () => {
    log.debug('Starting viewer initialization');
    OVE.Utils.initView(initView, loadURL, () => {
        const context = window.ove.context;
        const g = window.ove.geometry;
        // Appropriately scaling and positioning the player is necessary.
        context.scale = Math.min(g.section.w / g.w, g.section.h / g.h);
        const width = (g.section.w / context.scale) + 'px';
        const height = (g.section.h / context.scale) + 'px';
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

    // BACKWARDS-COMPATIBILITY: For <= v0.4.1
    if (!Constants.Frame.PARENT) {
        Constants.Frame.PARENT = 'parent';
    }

    // Cull occluded sections
    setTimeout(() => {
        window.ove.frame.send(Constants.Frame.PARENT, { cull: { sectionId: OVE.Utils.getSectionId() } }, 'core');
    }, Constants.FRAME_LOAD_DELAY);
};
