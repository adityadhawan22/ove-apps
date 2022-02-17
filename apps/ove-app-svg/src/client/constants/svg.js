const Constants = {
    /**************************************************************
                              Controller
    **************************************************************/
    TUORIS_LOAD_DELAY: 350, // Unit: milliseconds
    DEFAULT_STATE_NAME: 'TrajansColumn',

    /**************************************************************
                                Common
    **************************************************************/
    TUORIS_HOST: (function () {
        let host = process.env.TUORIS_HOST;
        if (host) {
            if (host.indexOf('//') >= 0) {
                host = host.substring(host.indexOf('//') + 2);
            }
            if (host.indexOf('/') >= 0) {
                host = host.substring(0, host.indexOf('/'));
            }
        }
        return host;
    })(),
    SVG_FRAME: '.svg-frame',
    CONTENT_DIV: '.wrapper',
    APP_NAME: 'svg'

};

exports.Constants = Constants;
