const log = OVE.Utils.Logger('DistributedJS');

$(function () {
    const Constants = {
        APP_NAME: 'DistributedJS',
        CALL_OVERHEAD: 50, // Unit: milliseconds
        CONTROL_ACTIVATION_DELAY: 3000, // Unit: milliseconds
        STATE_BROADCAST_FREQUENCY: 350, // Unit: milliseconds
        CONTROLLER_WINDOW_NAME: 'control'
    };

    // Common function to handle an operation
    const handleOperation = function (op) {
        const context = window.ove.context;
        if (!context.eventHandlers.hasOwnProperty(op.name)) {
            log.warn('No event handler found with name:', op.name);
        } else if (op.type !== window.Distributed.SCHEDULE) {
            log.debug('Invoking event handler:', op.name);
            switch (op.type) {
                case window.Distributed.IMMEDIATE:
                case window.Distributed.TIMEOUT:
                    setTimeout(context.eventHandlers[op.name], op.runAt - window.ove.clock.getTime());
                    break;
                case window.Distributed.INTERVAL:
                    setTimeout(function () {
                        setInterval(context.eventHandlers[op.name], op.timeout);
                    }, op.runAt - window.ove.clock.getTime());
                    break;
                default:
                    log.warn('Ignoring unknown operation:', op.type);
            }
        }
    };

    const distribute = function (callback, type, timeout) {
        const op = {
            name: callback.name,
            type: arguments.length > 1 ? type : window.Distributed.SCHEDULE,
            runAt: (arguments.length > 2 && type === window.Distributed.TIMEOUT ? window.ove.clock.getTime() + timeout : window.ove.clock.getTime()) + Constants.CALL_OVERHEAD,
            timeout: arguments.length > 2 ? timeout : 0
        };
        log.debug('Forwarding event:', op);
        window.ove.socket.send({ operation: op });
        return op;
    };

    // This is what happens first. After OVE is loaded, the system will be ready for distributed operation.
    $(document).ready(function () {
        log.debug('Starting library');
        window.ove = new OVE(Constants.APP_NAME, '__OVEHOST__', window.name.substring(window.name.lastIndexOf('/') + 1).split('-')[1]);
        log.debug('Completed loading OVE');
        let context = window.ove.context;
        // Within the OVE context, this application stores shared operations, event handlers and state.
        context.handleOperation = handleOperation;
        context.distribute = distribute;
        context.eventHandlers = {};
        context.state = {};
        context.watching = [];
        context.operations = [];
        context.isController = (window.name.substring(window.name.lastIndexOf('/') + 1).split('-')[0] === Constants.CONTROLLER_WINDOW_NAME);
        if (context.isController) {
            context.isInitialized = false;
            setTimeout(function () {
                // We wait until the entire system is ready for a distributed operation.
                while (context.operations.length > 0) {
                    const op = context.operations.shift();
                    context.handleOperation(context.distribute(op.callback, op.type, op.timeout));
                }
                context.isInitialized = true;
                log.debug('Application is initialized:', context.isInitialized);
            }, Constants.CONTROL_ACTIVATION_DELAY);
            setInterval(function () {
                // State is broadcast if there were any updates.
                const state = window.ove.state.current;
                if (!OVE.Utils.JSON.equals(state, context.state)) {
                    log.debug('Broadcasting state:', state);
                    window.ove.socket.send({ state: state });
                    context.state = JSON.parse(JSON.stringify(state));
                }
            }, Constants.STATE_BROADCAST_FREQUENCY);
        } else {
            context.isInitialized = true;
        }
        window.ove.socket.on(function (message) {
            if (message.operation) {
                handleOperation(message.operation);
            } else if (message.state) {
                window.ove.state.current = message.state;
            }
        });
    });
});

/**
 * An enumeration representing types of distributed operations
 */
window.Distributed = {
    IMMEDIATE: 0,
    SCHEDULE: 1,
    TIMEOUT: 2,
    INTERVAL: 3
};

/**
 * Distributes the execution of JS functions.
 * @param {function} callback The function that would be distributed
 * @param {Distributed} type  Numeric identifier explaining the type of operation
 *                              Distributed.SCHEDULE  - scheduled for on-demand execution
 *                              Distributed.IMMEDIATE - run immediately
 *                              Distributed.TIMEOUT   - run after a timeout
 *                              Distributed.INTERVAL  - run at an interval specified by the timeout
 *                            Could also use the Distributed enumeration
 * @param {number} timeout    Time in milliseconds
 */
window.setDistributed = function (callback, type, timeout) {
    const Constants = {
        OVE_LOADED_DELAY: 50 // Unit: milliseconds
    };

    if (callback === undefined) {
        const err = 'Callback function not provided';
        log.error(err);
        throw Error(err);
    }
    const __self = {
        callback: callback,
        type: arguments.length === 1 ? window.Distributed.IMMEDIATE : type,
        timeout: timeout
    };
    new Promise(function (resolve) {
        const x = setInterval(function () {
            // Test for whether OVE has been loaded.
            if (window.ove !== undefined && window.ove.context !== undefined) {
                clearInterval(x);
                resolve('ove loaded');
            }
        }, Constants.OVE_LOADED_DELAY);
    }).then(function () {
        const context = window.ove.context;
        log.debug('Registering callback:', __self.callback.name);
        // The callback can only be registered once OVE has been loaded
        context.eventHandlers[__self.callback.name] = __self.callback;
        // We only run operations from the controller. Operations would be queued until the
        // controller is ready to distribute their execution.
        if (context.isController) {
            if (!context.isInitialized) {
                context.operations.push(__self);
            } else {
                context.handleOperation(context.distribute(
                    __self.callback, __self.type, __self.timeout));
            }
        }
    });
};

/**
 * A mechanism to watch updates on one or more properties.
 * @param {string} name      Name of property
 * @param {object} property  Getter/Setter related to property in the { get: fn(), set: fn() } format
 * @param {number} frequency Frequency in milliseconds - set this to zero/null or do not pass this to stop watching
 */
window.watch = function (name, property, frequency) {
    const Constants = {
        OVE_LOADED_DELAY: 50 // Unit: milliseconds
    };

    if (name === undefined) {
        const err = 'Name of property not provided';
        log.error(err);
        throw Error(err);
    }

    const __self = {
        name: name,
        property: property,
        frequency: frequency
    };

    if (__self.property !== undefined && __self.property.get !== undefined && __self.property.set !== undefined) {
        new Promise(function (resolve) {
            const x = setInterval(function () {
                // Test for whether OVE has been loaded and initialized.
                if (window.ove !== undefined && window.ove.context !== undefined && window.ove.context.isInitialized) {
                    clearInterval(x);
                    resolve('ove initialized');
                }
            }, Constants.OVE_LOADED_DELAY);
        }).then(function () {
            const context = window.ove.context;
            // Update watch when it is reset.
            if (context.eventHandlers.hasOwnProperty(__self.name)) {
                log.debug('No longer watching:', __self.name);
                clearInterval(context.watching[__self.name]);
                if (!__self.frequency) {
                    // No longer watching
                    return;
                }
            } else if (!__self.frequency) {
                const err = 'Invalid frequency';
                log.error(err);
                throw Error(err);
            }
            log.debug('Started watching:', __self.name, 'with frequency:', __self.frequency);
            context.watching[__self.name] = setInterval(function () {
                if (context.isController) {
                    window.ove.state.current[__self.name] = __self.property.get();
                    return;
                }

                const state = window.ove.state.current;
                if (!OVE.Utils.JSON.equals(state[__self.name], context.state[__self.name])) {
                    log.debug('Detected state change - updating variable:', __self.name);
                    __self.property.set(state[__self.name]);
                    context.state[__self.name] = JSON.parse(JSON.stringify(state))[__self.name];
                }
            }, __self.frequency);
        });
    }
};
