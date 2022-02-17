const Constants = {
    /**************************************************************
                                Viewer
    **************************************************************/
    BUFFER_STATUS_BROADCAST_FREQUENCY: 700, // Unit: milliseconds
    POSITION_BROADCAST_FREQUENCY: 350, // Unit: milliseconds
    RESCALE_DURING_REFRESH_TIMEOUT: 1000, // Unit: milliseconds
    FRAME_LOAD_DELAY: 100, // Unit: milliseconds

    /**************************************************************
                              Controller
    **************************************************************/
    WAIT_FOR_BUFFERING_DURATION: 1000, // Unit: milliseconds
    SHOW_CONTROLLER_AFTER_DURATION: 15000, // Unit: milliseconds
    DEFAULT_STATE_NAME: 'DSIIntro',
    CONTROLLER: '.operations',

    /**************************************************************
                             Video Player
    **************************************************************/
    VIDEO_READY_TIMEOUT: 500, // Unit: milliseconds
    STARTING_TIME: 0, // Unit: seconds
    STANDARD_RATE: 1,
    YOUTUBE_PLAYER_LOADED_TEST_INTERVAL: 1000, // Unit: milliseconds
    YOUTUBE_PLAYBACK_LOOP_TEST_INTERVAL: 100, // Unit: milliseconds

    /**************************************************************
                                Server
    **************************************************************/
    SOCKET_REFRESH_DELAY: 5000, // Unit: milliseconds
    SOCKET_READY_WAIT_TIME: 3000, // Unit: milliseconds
    OPERATION_SYNC_DELAY: 350, // Unit: milliseconds
    HTTP_HEADER_CONTENT_TYPE: 'Content-Type',
    HTTP_CONTENT_TYPE_JSON: 'application/json',

    /**************************************************************
                                Common
    **************************************************************/
    MIN_BUFFERED_PERCENTAGE: 15,
    MIN_BUFFERED_DURATION: 15, // Unit: seconds
    POSITION_CORRECTION_FREQUENCY: 50, // Unit: milliseconds
    SET_TIMEOUT_TEST_DURATION: 10, // Unit: milliseconds
    POSITION_SYNC_ACCURACY: 120, // Unit: FPS
    CONTENT_DIV: '#video_player',
    WRAPPER_DIV: '.outer',
    WAITING_MSG: '.waiting',
    APP_NAME: 'videos'
};

/**************************************************************
                            Enums
**************************************************************/
Constants.Operation = {
    PLAY: 'play',
    PAUSE: 'pause',
    STOP: 'stop',
    MUTE: 'mute',
    SEEK: 'seekTo',
    BUFFER_STATUS: 'bufferStatus'
};

Constants.Button = {
    PLAY: '#btnPlay',
    STOP: '#btnStop',
    MUTE: '#btnMute'
};

Constants.State = {
    ACTIVE: 'active'
};

Constants.BufferStatus = {
    COMPLETE: 'complete',
    BUFFERING: 'buffering'
};

exports.Constants = Constants;
