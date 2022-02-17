const Constants = {
    /**************************************************************
                              Controller
    **************************************************************/
    DEFAULT_STATE_NAME: 'Default',
    CONTROLLER: '.operations',
    CONTROL_CANVAS: '.controller',
    OVE_FRAME: '.ove-frame',
    MAX_ZOOM_LEVEL: 10,
    TOUCH_REFRESH_TIMEOUT: 100, // Unit: milliseconds
    FRAME_LOAD_DELAY: 100, // Unit: milliseconds

    /**************************************************************
                                Common
    **************************************************************/
    TRANSFORMATION_TIMEOUT: 350, // Unit: milliseconds
    CONTENT_DIV: '.wrapper',
    APP_NAME: 'controller'
};

/**************************************************************
                            Enums
**************************************************************/
Constants.Mode = {
    SPACE: 'space',
    GROUP: 'group',
    GEOMETRY: 'geometry'
};

Constants.Button = {
    SHOW_BACKGROUND: '#btnShowBackground',
    RESET: '#btnReset',
    TOUCH: '#btnTouch'
};

Constants.State = {
    ACTIVE: 'active',
    TOUCH_ACTIVE: 'touch'
};

exports.Constants = Constants;
