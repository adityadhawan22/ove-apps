initControl = function (data) {
    let context = window.ove.context;
    context.isInitialized = false;
    log.debug('Application is initialized:', context.isInitialized);
    log.debug('Restoring state:', data);
    const state = window.ove.state.current = data;
    // If a URL was passed, the URL of the loaded state would be overridden.
    const mode = OVE.Utils.getQueryParam('mode') || state.mode;
    const groupId = OVE.Utils.getQueryParam('groupId') || state.groupId;
    const space = OVE.Utils.getSpace();
    log.debug('Controller mode:', mode);
    let url;
    switch (mode) {
        case Constants.Mode.SPACE:
            url = window.ove.context.hostname + '/sections?space=' + space;
            break;
        case Constants.Mode.GROUP:
            url = window.ove.context.hostname + '/sections?groupId=' + parseInt(groupId, 10);
            break;
        case Constants.Mode.GEOMETRY:
            let coords = OVE.Utils.Coordinates.transform([0, 0],
                OVE.Utils.Coordinates.SECTION, OVE.Utils.Coordinates.SPACE);
            coords.push([window.ove.geometry.section.w, window.ove.geometry.section.h]);
            url = window.ove.context.hostname + '/sections?geometry=' + coords.join();
            break;
        default:
            log.warn('Ignoring controller mode:', mode);
            return;
    }
    fetch(url).then(function (r) { return r.text(); }).then(function (text) {
        context.sections = JSON.parse(text);
        context.transformation = { current: { zoom: 1, pan: { x: 0, y: 0 } }, next: { zoom: 1, pan: { x: 0, y: 0 } } };
        context.isInitialized = true;
        log.debug('Application is initialized:', context.isInitialized);
        const g = window.ove.geometry;
        context.factor = Math.max(g.section.w / Math.min(document.documentElement.clientWidth, window.innerWidth),
            g.section.h / Math.min(document.documentElement.clientHeight, window.innerHeight));
        log.debug('Computed scaling factor:', context.factor);
        log.debug('Registered information of sections, count:', context.sections.length);
        log.debug('Saving base state of sections');
        context.sectionId = +OVE.Utils.getSectionId();
        // Ensure sectionId is no longer returned, so that we can work with multiple sections.
        OVE.Utils.getSectionId = OVE.Utils.getViewId = function () { return undefined; };
        context.sections.forEach(function (section, i) {
            // Prevent registration of own self and sections not in same space.
            if (section.id === context.sectionId || section.space !== space) {
                context.sections.splice(i, 1);
                return;
            }
            const endpoint = section.app.url + '/states/base';
            $.ajax({ url: endpoint, dataType: 'json' }).always(function (data) {
                // If 'data.status' exists, that is an indication of an error. However, if the state of some app
                // also has a 'status' property, the outcome can be confusing. This check is to ensure it is an
                // error state.
                if (data.status === 400) {
                    $.ajax({ url: section.app.url + '/instances/' + section.id + '/state', dataType: 'json' }).done(
                        function (payload) {
                            log.debug('Saving base state for section using URL:', endpoint, ', payload:', payload);
                            $.ajax({ url: endpoint, type: 'POST', data: JSON.stringify(payload), contentType: 'application/json' });
                        }).catch(log.error);
                } else {
                    log.debug('Base state already cached at URL:', endpoint, ', payload:', data);
                }
            });
            $.ajax({ url: section.app.url + '/name', dataType: 'json' }).done(
                function (name) {
                    log.debug('Setting up control sockets for app:', name);
                    section.ove = new OVE(name, context.hostname.substring(context.hostname.indexOf('//') + 2), section.id);
                    section.ove.socket.on(function (message) {
                        if (!OVE.Utils.JSON.equals(message, section.current)) {
                            const payload = JSON.stringify({
                                source: section.current,
                                target: message
                            });
                            section.current = message;
                            log.trace('Fetching transformation from section:', section.id);
                            const endpoint = section.app.url + '/diff';
                            log.trace('Sending difference request to URL:', endpoint, ', payload:', payload);
                            $.ajax({ url: endpoint, type: 'POST', data: payload, contentType: 'application/json' })
                                .done(function (transformation) {
                                    const current = context.transformation.current;
                                    context.transformation.next = {
                                        triggeredBy: section.id,
                                        zoom: current.zoom * transformation.zoom,
                                        pan: { x: current.pan.x + transformation.pan.x, y: current.pan.y + transformation.pan.y }
                                    };
                                    log.trace('Next transformation event is:', context.transformation.next);
                                }).catch(log.error);
                        }
                    });
                }).catch(log.error);
        });
        // D3 is used for pan and zoom operations. Zoom is limited to a factor of 10.
        log.debug('Registering pan/zoom listeners');
        d3.select(Constants.CONTROL_CANVAS).call(d3.zoom().scaleExtent([1, Constants.MAX_ZOOM_LEVEL]).on('zoom', function () {
            const event = d3.event.transform;
            log.trace('Got D3 event with, k:', event.k, 'x:', event.x, 'y:', event.y);
            context.transformation.next = {
                zoom: event.k,
                pan: {
                    // Avoid the scenario of getting a nasty -0.
                    x: event.x === 0 ? 0 : -1 * event.x,
                    y: event.y === 0 ? 0 : -1 * event.y
                }
            };
            log.trace('Next transformation event is:', context.transformation.next);
        }));
        $(Constants.CONTROL_CANVAS).addClass(Constants.State.TOUCH_ACTIVE);
        // Touch-events from clients;
        window.ove.socket.on(function (message) {
            if (message.event) {
                context.transformation.next = {
                    zoom: 1 + (message.event.zoom - 1) / context.factor,
                    pan: { x: message.event.pan.x / context.factor, y: message.event.pan.y / context.factor }
                };
            }
        });
        // Separate out the application of the transformation (slow-running)
        // from the capturing of the movement (fast-running).
        setInterval(applyTransformation, Constants.TRANSFORMATION_TIMEOUT);
    });
    OVE.Utils.resizeController(Constants.CONTENT_DIV);

    log.debug('Creating control canvas');
    $('<canvas>', {
        class: Constants.CONTROL_CANVAS.substring(1)
    }).appendTo(Constants.CONTENT_DIV);
    const canvas = $(Constants.CONTROL_CANVAS)[0];
    canvas.height = window.ove.geometry.section.h;
    canvas.width = window.ove.geometry.section.w;
    if (window.ove.state.current.showTouch === undefined) {
        window.ove.state.current.showTouch = true;
    }
    if (window.ove.state.current.showTouch && !$(Constants.Button.TOUCH).hasClass(Constants.State.ACTIVE)) {
        $(Constants.Button.TOUCH).addClass(Constants.State.ACTIVE);
        broadcastState();
    }
    loadControls();
};

applyTransformation = function () {
    const context = window.ove.context;
    if (context.operationInProgress) {
        return;
    }
    const current = context.transformation.current;
    const next = context.transformation.next;
    if (!OVE.Utils.JSON.equals(current, next)) {
        context.operationInProgress = true;
        context.transformation.current = next;

        let triggeredBy = null;
        if (context.transformation.current.triggeredBy) {
            triggeredBy = context.transformation.current.triggeredBy;
            delete context.transformation.current.triggeredBy;
        }
        log.debug('Applying transformation:', context.transformation.current);
        context.sections.forEach(function (section) {
            if (section.id !== triggeredBy) {
                const endpoint = section.app.url + '/instances/' + section.id + '/state/transform';
                const payload = JSON.stringify(context.transformation.current);
                log.trace('Applying transformation on section using URL:', endpoint, ', payload:', payload);
                $.ajax({ url: endpoint, type: 'POST', data: payload, contentType: 'application/json' }).done(
                    function (response) {
                        section.current = response;
                        section.ove.socket.send(section.current);
                    }).catch(log.error);
            }
        });
        setTimeout(function () {
            context.operationInProgress = false;
        }, Constants.TRANSFORMATION_TIMEOUT);
    }
};

beginInitialization = function () {
    log.debug('Starting controller initialization');
    $(document).on(OVE.Event.LOADED, function () {
        // This check is important since the 'section.ove' instances keep firing 'OVE.Event.LOADED'.
        if (!window.ove.context.isInitialized) {
            log.debug('Invoking OVE.Event.Loaded handler');
            OVE.Utils.initControlOnDemand(Constants.DEFAULT_STATE_NAME, initControl);
        }
    });
};

broadcastState = function () {
    log.debug('Displaying touch UI:', window.ove.state.current.showTouch);
    log.debug('Broadcasting state');
    OVE.Utils.broadcastState();
};

loadControls = function () {
    log.debug('Displaying controller');
    const scale = Math.min(Math.min(document.documentElement.clientWidth, window.innerWidth) / 1440,
        Math.min(document.documentElement.clientHeight, window.innerHeight) / 720);
    $(Constants.CONTROLLER).css({ display: 'block', transformOrigin: '50% 50%', transform: 'scale(' + scale + ')' });

    $(Constants.Button.RESET).click(function () {
        // Refresh Touch UI
        window.ove.state.current.showTouch = false;
        broadcastState();
        setTimeout(function () {
            window.ove.state.current.showTouch = true;
            broadcastState();
        }, Constants.TOUCH_REFRESH_TIMEOUT);

        const context = window.ove.context;
        context.sections.forEach(function (section) {
            $.ajax({ url: section.app.url + '/states/base', dataType: 'json' }).done(function (payload) {
                section.current = payload;
                $.ajax({ url: section.app.url + '/instances/' + section.id + '/state', type: 'POST', data: JSON.stringify(payload), contentType: 'application/json' });
                section.ove.socket.send(payload);
                log.debug('Restored state of section:', section.id, 'to:', payload);
            });
        });
        context.transformation = { current: { zoom: 1, pan: { x: 0, y: 0 } }, next: { zoom: 1, pan: { x: 0, y: 0 } } };
    });

    $(Constants.Button.TOUCH).click(function () {
        $(Constants.Button.TOUCH).toggleClass(Constants.State.ACTIVE);
        window.ove.state.current.showTouch = $(Constants.Button.TOUCH).hasClass(Constants.State.ACTIVE);
        broadcastState();
    });

    $(Constants.Button.SHOW_BACKGROUND).click(function () {
        $(Constants.Button.SHOW_BACKGROUND).toggleClass(Constants.State.ACTIVE);
        if (!$(Constants.Button.SHOW_BACKGROUND).hasClass(Constants.State.ACTIVE)) {
            $(Constants.OVE_FRAME).remove();
            return;
        }

        const context = window.ove.context;
        fetch(context.hostname + '/spaces?oveSectionId=' + context.sectionId)
            .then(function (r) { return r.text(); }).then(function (text) {
                const space = Object.keys(JSON.parse(text))[0];
                log.debug('Loading space:', space);

                let clients = Object.values(JSON.parse(text))[0];
                // We load each client into the controller so that it is possible to see the live
                // contents of the space. The client is reduced in size by the computed scaling
                // factor such that they all fit within the controller's screen.
                clients.forEach(function (c, i) {
                    if (c.x !== undefined && c.y !== undefined && c.w !== undefined && c.h !== undefined) {
                        $('<iframe>', {
                            src: context.hostname + '/view.html?oveViewId=' + space + '-' + i,
                            class: Constants.OVE_FRAME.substring(1),
                            allowtransparency: true,
                            frameborder: 0,
                            scrolling: 'no'
                        }).css({
                            zoom: 1,
                            transformOrigin: '0% 0%',
                            transform: 'scale(' + (1 / context.factor) + ')',
                            // Each client is loaded in its original size and then scaled-down.
                            width: (c.w + c.offset.x) + 'px',
                            height: (c.h + c.offset.y) + 'px',
                            position: 'absolute',
                            marginLeft: (c.x - c.offset.x) / context.factor,
                            marginTop: (c.y - c.offset.y) / context.factor
                        }).appendTo(Constants.CONTENT_DIV);
                    }
                });
                // Only displaying the subset of sections in the background.
                setTimeout(function () {
                    const filter = [];
                    context.sections.forEach(function (section) {
                        filter.push(section.id);
                    });
                    window.ove.frame.send(Constants.Frame.CHILD, { load: true, filters: { includeOnly: filter } }, 'core');
                }, Constants.FRAME_LOAD_DELAY);
            });
    });
};
