initView = function () {
    window.ove.context.isInitialized = false;
    log.debug('Application is initialized:', window.ove.context.isInitialized);
    OVE.Utils.setOnStateUpdate(handleStateUpdate);
};

beginInitialization = function () {
    log.debug('Starting viewer initialization');
    OVE.Utils.initView(initView, handleStateUpdate, function () {
        OVE.Utils.resizeViewer(Constants.CONTENT_DIV);
        log.debug('Creating control canvas');
        $('<canvas>', {
            class: Constants.CONTROL_CANVAS.substring(1)
        }).appendTo(Constants.CONTENT_DIV);
        const canvas = $(Constants.CONTROL_CANVAS)[0];
        canvas.height = window.ove.geometry.section.h;
        canvas.width = window.ove.geometry.section.w;

        const context = window.ove.context;
        context.transformation = { current: { zoom: 1, pan: { x: 0, y: 0 } }, next: { zoom: 1, pan: { x: 0, y: 0 } } };
        // D3 is used for pan and zoom operations. Zoom is limited to a factor of 10.
        log.debug('Registering pan/zoom listeners');
        d3.select(Constants.CONTROL_CANVAS).call(d3.zoom().scaleExtent([1, 10]).on('zoom', function () {
            if (window.ove.state.current.showTouch) {
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
            }
        }));
        // Separate out the application of the transformation (slow-running)
        // from the capturing of the movement (fast-running).
        setInterval(applyTransformation, Constants.TRANSFORMATION_TIMEOUT);
        context.isInitialized = true;
        log.debug('Application is initialized:', context.isInitialized);
    });
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
        window.ove.socket.send({ event: context.transformation.current });
        context.operationInProgress = false;
    }
};

handleStateUpdate = function () {
    if (window.ove.state.current.showTouch) {
        if (!$(Constants.CONTROL_CANVAS).hasClass(Constants.State.TOUCH_ACTIVE)) {
            window.ove.context.transformation = { current: { zoom: 1, pan: { x: 0, y: 0 } }, next: { zoom: 1, pan: { x: 0, y: 0 } } };
            $(Constants.CONTROL_CANVAS).addClass(Constants.State.TOUCH_ACTIVE);
        }
    } else if ($(Constants.CONTROL_CANVAS).hasClass(Constants.State.TOUCH_ACTIVE)) {
        $(Constants.CONTROL_CANVAS).removeClass(Constants.State.TOUCH_ACTIVE);
    }
};
