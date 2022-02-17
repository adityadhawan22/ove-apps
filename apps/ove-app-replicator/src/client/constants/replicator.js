const Constants = {
    /**************************************************************
                                Viewer
    **************************************************************/
    DEFAULT_STATE_NAME: 'Default',
    OVE_FRAME: '.ove-frame',
    FRAME_LOAD_DELAY: 500, // Unit: milliseconds
    CONTENT_DIV: '.wrapper',
    SPACE_DIV: '.inner',
    APP_NAME: 'replicator'
};

/**************************************************************
                            Enums
**************************************************************/
Constants.Mode = {
    SPACE: 'space',
    GROUP: 'group',
    SECTION: 'section'
};

exports.Constants = Constants;
