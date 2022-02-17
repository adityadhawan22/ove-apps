const Constants = {
    /**************************************************************
                                Viewer
    **************************************************************/
    OSD_POST_LOAD_WAIT_TIME: 350, // Unit: milliseconds
    OSD_POSITION_UPDATE_FREQUENCY: 200, // Unit: milliseconds

    /**************************************************************
                              Controller
    **************************************************************/
    DEFAULT_STATE_NAME: 'Highsmith',
    OSD_MONITORED_EVENTS: ['resize', 'zoom', 'pan'],

    /**************************************************************
                                Common
    **************************************************************/
    CONTENT_DIV: '#contentDiv',
    APP_NAME: 'images',

    /**************************************************************
     Server
     **************************************************************/
    HTTP_HEADER_CONTENT_TYPE: 'Content-Type',
    HTTP_CONTENT_TYPE_JSON: 'application/json'
};

/**************************************************************
 Enums
 **************************************************************/
Constants.Operation = {
    PAN: 'pan',
    ZOOM: 'zoom'
};

exports.Constants = Constants;
