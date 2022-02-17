/**
 * Helper library for distributing Three.js functionality using the Distributed.js library.
 */
THREE.Distributed = function (options) {
    const Constants = {
        PropertyNames: {
            CAMERA: 'camera',
            CONTROLS: 'controls'
        },
        WATCH_INTERVAL: 500 // Unit: milliseconds
    };

    const getCameraProperty = function (camera) {
        return {
            get: function () {
                const p = camera.position.clone();
                const r = camera.rotation.clone();
                return {
                    position: { x: p.x, y: p.y, z: p.z },
                    rotation: { x: r.x, y: r.y, z: r.z }
                };
            },
            set: function (value) {
                camera.position.set(value.position.x, value.position.y, value.position.z);
                camera.rotation.set(value.rotation.x, value.rotation.y, value.rotation.z);
            }
        };
    };

    const getControlsProperty = function (controls) {
        return {
            get: function () {
                const t = controls.target.clone();
                return {
                    target: { x: t.x, y: t.y, z: t.z }
                };
            },
            set: function (value) {
                controls.target.set(value.target.x, value.target.y, value.target.z);
            }
        };
    };

    /**
     * Synchronises controllers with viewers
     */
    this.sync = function () {
        const camera = options.camera || options.controls.object;
        window.watch(Constants.PropertyNames.CAMERA, getCameraProperty(camera), Constants.WATCH_INTERVAL);
        window.watch(Constants.PropertyNames.CONTROLS, getControlsProperty(options.controls), Constants.WATCH_INTERVAL);
    };
};
