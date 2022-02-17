const Constants = {
    /**************************************************************
                                Viewer
    **************************************************************/
    FRAME_LOAD_DELAY: 100, // Unit: milliseconds

    /**************************************************************
                              Controller
    **************************************************************/
    DEFAULT_STATE_NAME: 'London',

    /**************************************************************
                            Mapping Library
    **************************************************************/
    OL_MONITORED_EVENTS: ['change:resolution', 'change:zoom', 'change:center'],
    OL_CHANGE_CENTER_AFTER_UPDATE_WAIT_TIME: 70, // Unit: milliseconds
    OL_ZOOM_ANIMATION_DURATION: 0, // Unit: milliseconds. 0 means no animation.
    OL_LOAD_WAIT_TIME: 3000, // Unit: milliseconds
    BING_MAPS_RELOAD_INTERVAL: 1000, // Unit: milliseconds
    LEAFLET_LAYER_LOAD_DELAY: 350, // Unit: milliseconds
    LEAFLET_MONITORED_EVENTS: ['zoomend', 'moveend'],

    /**************************************************************
                                Common
    **************************************************************/
    APP_NAME: 'maps',

    /**************************************************************
     Server
     **************************************************************/
    HTTP_HEADER_CONTENT_TYPE: 'Content-Type',
    HTTP_CONTENT_TYPE_JSON: 'application/json',

    CORE: 'core'
};

/**************************************************************
 Enums
 **************************************************************/
Constants.Operation = {
    PAN: 'pan',
    ZOOM: 'zoom'
};

Constants.Action = {
    CONNECT: 'connect'
};

exports.Constants = Constants;
