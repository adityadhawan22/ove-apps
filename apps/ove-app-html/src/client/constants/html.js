const Constants = {
    /**************************************************************
                              Controller
    **************************************************************/
    DEFAULT_STATE_NAME: 'Matrix',
    CONTROLLER: '.operations',

    /**************************************************************
                                Server
    **************************************************************/
    SOCKET_REFRESH_DELAY: 5000, // Unit: milliseconds
    SOCKET_READY_WAIT_TIME: 3000, // Unit: milliseconds
    HTTP_HEADER_CONTENT_TYPE: 'Content-Type',
    HTTP_CONTENT_TYPE_JS: 'application/javascript',
    HTTP_CONTENT_TYPE_JSON: 'application/json',

    /**************************************************************
                                Common
    **************************************************************/
    OPERATION_SYNC_DELAY: 350, // Unit: milliseconds
    HTML_FRAME: '.html-frame',
    CONTENT_DIV: '.wrapper',
    APP_NAME: 'html'
};

/**************************************************************
                            Enums
**************************************************************/
Constants.Operation = {
    REFRESH: 'refresh'
};

Constants.Button = {
    REFRESH: '#btnRefresh'
};

exports.Constants = Constants;
