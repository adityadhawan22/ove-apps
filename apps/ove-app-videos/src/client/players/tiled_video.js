function OVETiledVideoPlayer () {
    const log = OVE.Utils.Logger('OVETiledVideoPlayer', Constants.LOG_LEVEL);

    this.initialize = function () {
        return new Promise(function (resolve) {
            OVE.Utils.logThenResolve(log.debug, resolve, 'video player loaded');
        });
    };

    const correctPosition = function () {
        const videoCount = $('.video').length;
        let counter = 0;
        let context = window.ove.context;
        const overallTimePenalty = context.sync.timePenalty;
        context.sync.timePenalty = 0;
        $('.video').each(function (_i, video) {
            try {
                // We are doing nothing if the player is not initialized or if
                // no video is loaded as yet.
                if (video.duration > 0) {
                    let timePenalty = 0;
                    $('.video').each(function (_i, peer) {
                        // We assume that the peer has been playing continuously. If so,
                        // they should currently be at video.currentTime - peer.currentTime
                        // The time penalty would be the greatest amount of time that this
                        // player is ahead of a peer.
                        if (peer !== video && peer.duration > 0) {
                            timePenalty = Math.max(timePenalty, video.currentTime - peer.currentTime);
                        }
                    });
                    timePenalty += overallTimePenalty;
                    if (timePenalty > 1000 / Constants.POSITION_SYNC_ACCURACY) {
                        let t1 = window.ove.clock.getTime();
                        setTimeout(function () {
                            // There is an overhead in terms of setting a timeout. This must be
                            // accounted for when penalising the video for playing faster than its
                            // peers.
                            timePenalty -= window.ove.clock.getTime() - t1 - Constants.SET_TIMEOUT_TEST_DURATION;

                            // To correct the speeds we pause and play the video
                            video.pause();
                            setTimeout(function () {
                                if (!context.sync.notPlaying) {
                                    video.play();
                                }
                                log.debug('Fixed playback by delaying video by:', timePenalty);
                                counter++;
                            }, timePenalty);
                        }, Constants.SET_TIMEOUT_TEST_DURATION);
                    } else {
                        counter++;
                    }
                } else {
                    counter++;
                }
            } catch (e) { } // Random player errors
        });
        new Promise(function (resolve) {
            const x = setInterval(function () {
                // Test for videos have been time synchronised.
                if (counter === videoCount) {
                    clearInterval(x);
                    resolve('videos time synchronised');
                }
            }, Constants.POSITION_CORRECTION_FREQUENCY);
        }).then(function () {
            setTimeout(correctPosition, Constants.POSITION_CORRECTION_FREQUENCY);
        });
    };

    this.load = function (config) {
        log.debug('Loading tiled video at URL:', config.url);
        $.ajax({ url: config.url, dataType: 'json' }).done(function (tc) {
            if (tc.width === undefined || tc.height === undefined ||
                tc.rows === undefined || tc.cols === undefined) {
                log.error('Invalid tile configuration at URL:', config.url);
            } else {
                let g = window.ove.geometry;
                let scale = 0;
                let offset = {};
                let dim = {};
                let s;
                if (window.ove.context.scale) {
                    s = window.ove.context.scale;
                    dim.h = g.section.h / s;
                    dim.w = g.section.w / s;
                } else {
                    dim.h = document.documentElement.clientHeight;
                    dim.w = document.documentElement.clientWidth;
                }
                if (tc.width * dim.h >= dim.w * tc.height) {
                    scale = dim.w / tc.width;
                    offset.y = (dim.h - dim.w * tc.height / tc.width) / 2;
                    offset.x = 0;
                } else {
                    scale = dim.h / tc.height;
                    offset.x = (dim.w - dim.h * tc.width / tc.height) / 2;
                    offset.y = 0;
                }
                log.debug('Computed scale:', scale, 'and offset:', offset);
                let r = 0;
                let c = 0;
                while (r < tc.rows && c < tc.cols) {
                    let width = tc.width / tc.cols * scale;
                    let height = tc.height / tc.rows * scale;
                    log.debug('Computed tile width:', width, ', height:', height);
                    // We cull the video if it is outside of the viewport of the viewers
                    if (!s || (g.x / s <= offset.x + width * (c + 1) &&
                        (g.x + g.w) / s >= offset.x + width * c &&
                        g.y / s <= offset.y + height * (r + 1) &&
                        (g.y + g.h) / s >= offset.y + height * r)) {
                        $('<video>', {
                            src: config.url.replace('.otv', '_files/0/' + c + '_' + r + '.' + tc.format) +
                                '?nonce=' + OVE.Utils.getViewId(),
                            class: 'video',
                            muted: true,
                            autoplay: false,
                            controls: false
                        }).css({
                            zoom: 1,
                            width: width + 'px',
                            height: height + 'px',
                            position: 'absolute',
                            marginLeft: offset.x + width * c,
                            marginTop: offset.y + height * r
                        }).appendTo(Constants.CONTENT_DIV);
                    }
                    r++;
                    if (r === tc.rows) {
                        r = 0;
                        c++;
                    }
                }
            }
        }).catch(log.error);
        setTimeout(function () {
            $('.video').each(function (_i, video) {
                video.playbackRate = Constants.STANDARD_RATE;
                // Do not run this at a fixed interval to avoid call-stacking
                setTimeout(correctPosition, Constants.POSITION_CORRECTION_FREQUENCY);
            });
        }, Constants.VIDEO_READY_TIMEOUT);
    };

    this.play = function (loop) {
        log.debug('Playing video', 'loop:', loop);
        $('.video').each(function (_i, video) {
            video.loop = loop;
            let playPromise = video.play();
            // Chrome autoplay features have kept changing over time and below is so that
            // we are aware if anything doesn't work for some reason.
            if (playPromise !== undefined) {
                playPromise.catch(function (e) {
                    log.error('Unexpected error:', e.message);
                });
            }
        });
    };

    this.pause = function () {
        log.debug('Pausing video');
        $('.video').each(function (_i, video) {
            video.pause();
        });
    };

    this.seekTo = function (time) {
        log.debug('Seeking to time:', time);
        $('.video').each(function (_i, video) {
            video.currentTime = time;
        });
    };

    this.stop = function () {
        log.debug('Stopping video or preparing video for playback');
        // Stopping a video is the same as pausing it and moving the time slider
        // to the beginning.
        this.pause();
        this.seekTo(Constants.STARTING_TIME);
    };

    this.mute = function (mute) {
        $('.video').each(function (_i, video) {
            video.muted = mute;
        });
    };

    // The ready function is similar to the stop function in this case.
    this.ready = this.stop;

    this.isVideoLoaded = function () {
        let ready = true;
        $('.video').each(function (_i, video) {
            ready = ready && video.duration > 0;
        });
        return ready;
    };

    this.getLoadedPercentage = function () {
        let percentage = 100;
        $('.video').each(function (_i, video) {
            percentage = Math.min(percentage,
                video.seekable.end(video.seekable.length - 1) * 100 / video.duration);
        });
        return percentage;
    };

    this.getLoadedDuration = function () {
        let duration = 0;
        $('.video').each(function (_i, video) {
            duration = Math.min(duration, video.seekable.end(video.seekable.length - 1));
        });
        return duration;
    };

    this.getCurrentTime = function () {
        let position = 0;
        $('.video').each(function (_i, video) {
            position = Math.min(position, video.currentTime);
        });
        return position;
    };
}
