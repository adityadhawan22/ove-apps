const log = OVE.Utils.Logger(Constants.APP_NAME, Constants.LOG_LEVEL);

$(() => {
    // This is what happens first. After OVE is loaded, either the viewer or controller
    // will be initialized.
    $(document).ready(() => {
        log.debug('Starting application');
        window.ove = new OVE(Constants.APP_NAME);
        log.debug('Completed loading OVE');
        window.ove.context.isInitialized = false;
        beginInitialization();
    });
});

updateCanvas = () => {
    const context = window.ove.context;
    if (context.isInitialized) return;

    log.debug('Creating whiteboard canvas');
    $('<canvas>', {
        class: Constants.WHITEBOARD_CANVAS.substring(1)
    }).appendTo(Constants.CONTENT_DIV);
    log.debug('Initializing plotter');
    initializePlotter();
    context.isInitialized = true;
    log.debug('Application is initialized:', context.isInitialized);
};
