const log = OVE.Utils.Logger(Constants.APP_NAME, Constants.LOG_LEVEL);

$(function () {
    // This is what happens first. After OVE is loaded, either the viewer or controller
    // will be initialized.
    $(document).ready(function () {
        log.debug('Starting application');
        window.ove = new OVE(Constants.APP_NAME);
        log.debug('Completed loading OVE');
        window.ove.context.isInitialized = false;
        beginInitialization();
    });
});

loadSVGFrame = function () {
    if (!window.ove.context.isInitialized) {
        log.debug('Creating content iFrame');
        $('<iframe>', {
            class: Constants.SVG_FRAME.substring(1),
            allowtransparency: true,
            frameborder: 0,
            scrolling: 'no'
        }).css(getCSS()).appendTo(Constants.CONTENT_DIV);
    }
};
