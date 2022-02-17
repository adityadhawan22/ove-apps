initView = function () {
    window.ove.context.isInitialized = false;
    log.debug('Application is initialized:', window.ove.context.isInitialized);
};

beginInitialization = function () {
    log.debug('Starting viewer initialization');
    OVE.Utils.initView(initView, function () {}, function () {
        OVE.Utils.resizeViewer(Constants.CONTENT_DIV);
        updateCanvas();
    });
};

initializePlotter = function () {
    const context = window.ove.context;

    // Initialization of canvas
    context.canvas = $(Constants.WHITEBOARD_CANVAS)[0];

    // It is important to set canvas height and width like this to avoid it scaling.
    context.canvas.width = parseInt($(Constants.CONTENT_DIV).css('width'), 10);
    context.canvas.height = parseInt($(Constants.CONTENT_DIV).css('height'), 10);
    log.debug('Setting canvas height and width to:', context.canvas.height, context.canvas.width);

    context._2d = context.canvas.getContext('2d');
    context._2d.lineCap = context._2d.lineJoin = Constants.DEFAULT_LINE_JOIN;
    context._2d.save();
    log.debug('Successfully configured 2D context');

    // Operation to draw on canvas
    const drawOnCanvas = function (color, lineWidth, plots) {
        context._2d.strokeStyle = color;
        context._2d.lineWidth = lineWidth;
        context._2d.beginPath();
        context._2d.moveTo(plots[0].x, plots[0].y);

        for (let i = 1; i < plots.length; i++) {
            context._2d.lineTo(plots[i].x, plots[i].y);
        }
        context._2d.stroke();
    };

    window.ove.socket.on(function (operation) {
        if (operation.paint) {
            const data = operation.paint;
            context._2d.restore();
            if (data.plots && data.plots.length >= 1) {
                log.trace('Painting line with color:', data.color, 'along points:', data.plots);
                // An iterative redraw required in order to ensure the same thickness is obtained as source.
                // See explanation within the 'restoreFromPlotHistory' operation for more information.
                while (data.plots.length >= 1) {
                    drawOnCanvas(data.color, data.lineWidth, data.plots);
                    data.plots.pop();
                }
            } else if (data.text) {
                log.trace('Painting characters with color:', data.color, 'text:', data.text);
                context._2d.fillStyle = data.color;
                context._2d.font = data.fontSize + 'px ' + Constants.DEFAULT_FONT_NAME;
                context._2d.fillText(data.text.string, data.text.x, data.text.y);
            }
        } else if (operation.erase) {
            log.debug('Erasing contents of whiteboard');
            context._2d.clearRect(0, 0, context.canvas.width, context.canvas.height);
        } else {
            log.warn('Ignoring unknown operation:', Object.keys(operation)[0]);
        }
    });
};
