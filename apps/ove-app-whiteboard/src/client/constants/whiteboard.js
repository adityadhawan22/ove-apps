const Constants = {
    /**************************************************************
                              Controller
    **************************************************************/
    CONTROLLER: '.colorSwatch',
    DEFAULT_LINE_WIDTH: '1', // Unit: pixels
    DEFAULT_LINE_JOIN: 'round',
    DEFAULT_FONT_SIZE: '8', // Unit: pixels
    DEFAULT_FILE_NAME: 'whiteboard.json',
    FRAME_LOAD_DELAY: 100, // Unit: milliseconds

    /**************************************************************
                                Common
    **************************************************************/
    CONTENT_DIV: '.wrapper',
    OVE_FRAME: '.ove-frame',
    WHITEBOARD_CANVAS: '.drawCanvas',
    DEFAULT_FONT_NAME: 'Georgia',
    APP_NAME: 'whiteboard'
};

/**************************************************************
                            Enums
**************************************************************/
Constants.Button = {
    UNDO: '#btnUndo',
    REDO: '#btnRedo',
    ERASE: '#btnErase',
    TEXT: '#btnText',
    INC_FONT_SIZE: '#btnIncFontSize',
    DEC_FONT_SIZE: '#btnDecFontSize',
    UPLOAD: '#btnUpload',
    DOWNLOAD: '#btnDownload'
};

Constants.State = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
};

exports.Constants = Constants;
