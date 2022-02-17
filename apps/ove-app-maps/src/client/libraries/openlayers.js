function OVEOpenLayersMap () {
    const log = OVE.Utils.Logger('OpenLayers', Constants.LOG_LEVEL);
    let __private = {};

    // TWEAK: Resolution to https://github.com/CartoDB/torque/issues/302
    if (window.ol.TorqueLayer) {
        window.ol.TorqueLayer.prototype._render = function () {
            if (this.currentAnimationFrame >= 0) {
                this.cancelAnimationFrame.call(window, this.currentAnimationFrame);
            }
            if (this.requestAnimationFrame && this.requestAnimationFrame.call) {
                this.currentAnimationFrame = this.requestAnimationFrame.call(window, this.render);
            }
        };
    }

    // TWEAK: Resolution to https://github.com/CartoDB/torque/issues/303
    if (window.ol.CanvasLayer && window.ol.TorqueLayer && window.ol.TileLoader) {
        window.ol.TileLoader.prototype._initTileLoader = function (map) {
            const _that = this;
            this._map = map;
            this._view = map.getView();
            this._centerChangedId = this._view.on('change:center', function (e) {
                _that._updateTiles();
            }, this);

            this._postcomposeKey = undefined;

            this._resolutionChangedId = this._view.on('change:resolution', function (evt) {
                _that._currentResolution = _that._view.getResolution();
                if (_that._postcomposeKey) return;
                _that.fire('mapZoomStart');
                _that._postcomposeKey = _that._map.on('postcompose', function (evt) {
                    if (evt.frameState.viewState.resolution === _that._currentResolution) {
                        _that._updateTiles();
                        _that._map.un('postcompose', _that._postcomposeKey, _that);
                        _that._postcomposeKey = undefined;
                        _that.fire('mapZoomEnd');
                    }
                }, _that);
            }, this);

            this._updateTiles();
        };

        window.ol.TorqueLayer.prototype._removeTileLoader =
            window.ol.TileLoader.prototype._removeTileLoader = function () {
                this._view.un('change:center', this._centerChangedId, this);
                this._view.un('change:resolution', this._resolutionChangedId, this);

                this._removeTiles();
            };

        window.ol.TorqueLayer.prototype.setMap =
            window.ol.CanvasLayer.prototype.setMap = function (map) {
                if (this._map) {
                    // remove
                    this._map.un('pointerdrag', this.pointdragKey_, this);
                    this._map.un('change:size', this.sizeChangedKey_, this);
                    this._map.un('moveend', this.moveendKey_, this);
                    this._map.getView().un('change:center', this.centerChanged_, this);
                }
                this._map = map;

                if (map) {
                    var overlayContainer = this._map.getViewport().getElementsByClassName('ol-overlaycontainer')[0];
                    overlayContainer.appendChild(this.root_);

                    this.pointdragKey_ = map.on('pointerdrag', this._render, this);
                    this.moveendKey_ = map.on('moveend', this._render, this);
                    this.centerChanged_ = map.getView().on('change:center', this._render, this);
                    this.sizeChangedKey_ = map.on('change:size', this._reset, this);

                    if (this.options.tileLoader) {
                        window.ol.TileLoader.prototype._initTileLoader.call(this, map);
                    }
                    this._reset();
                }
            };
    }

    this.initialize = function (config) {
        // Initialization code for Open Layers
        log.info('Loading OpenLayers with view configuration:', config);
        let attachedLayers = [];
        let otherLayers = [];
        __private.layers.forEach(function (e) {
            if (e.type === 'ol.TorqueLayer') {
                otherLayers.push(e);
            } else {
                attachedLayers.push(e);
            }
        });
        __private.map = new window.ol.Map({
            target: 'map',
            controls: [],
            layers: attachedLayers,
            // Mouse-wheel-zoom, pinch-zoom and drag-zoom interactions are enabled
            // in addition to the defaults.
            interactions: window.ol.interaction.defaults({
                pinchRotate: false,
                zoomDuration: Constants.OL_ZOOM_ANIMATION_DURATION
            }).extend([
                new window.ol.interaction.MouseWheelZoom({ duration: Constants.OL_ZOOM_ANIMATION_DURATION }),
                new window.ol.interaction.PinchZoom({ duration: Constants.OL_ZOOM_ANIMATION_DURATION }),
                new window.ol.interaction.DragZoom({ duration: Constants.OL_ZOOM_ANIMATION_DURATION })
            ]),
            view: new window.ol.View(config)
        });
        otherLayers.forEach(function (e) {
            if (e.visible) {
                showLayer(e);
            }
        });
        return __private.map;
    };

    this.registerHandlerForEvents = function (eventHandler, isUpdate) {
        const changeEvent = function () {
            // it takes a while for the all attributes of the map to be updated, especially after
            // a resolution/zoom-level change.
            if (isUpdate()) return;
            setTimeout(eventHandler, Constants.OL_CHANGE_CENTER_AFTER_UPDATE_WAIT_TIME);
        };
        // Handlers for OpenLayers events.
        for (const e of Constants.OL_MONITORED_EVENTS) {
            if (e === 'change:center') {
                __private.map.getView().on(e, eventHandler);
            } else {
                __private.map.getView().on(e, changeEvent);
            }
            log.debug('Registering OpenLayers handler:', e);
        }
    };

    this.loadLayers = function (config) {
        // The most complex operation in the initialization process is building
        // the layers of OpenLayers based on the JSON configuration model of the
        // layers. Tile and Vector layers are supported by the app. There is
        // special handling for the BingMaps layer as it fails to load at times.
        // The vector layers can be one of the vector formats supported by OpenLayers
        // such as GeoJSON and TopoJSON, the GML, KML and WKT CRS formats of the
        // Open Geospatial Consortium as well as the proprietary OSM, IGC and Esri
        // formats. The fill and stroke styles are configurable.
        __private.layers = [];
        $.each(config, function (i, e) {
            if (e.type === 'ol.layer.Tile') {
                log.trace('Loading layer of type:', 'Tile', ', with source:',
                    e.source.type, ', using config:', e);
                const TileConfig = {
                    visible: e.visible,
                    source: new window.ol.source[e.source.type.substring('ol.source.'.length)](e.source.config)
                };
                if (e.source.type === 'ol.source.BingMaps') {
                    TileConfig.preload = Infinity;
                }
                __private.layers[i] = new window.ol.layer.Tile(TileConfig);
                if (e.source.type === 'ol.source.BingMaps') {
                    __private.layers[i].bingMapsSource = { config: e.source.config };
                }
            } else if (e.type === 'ol.layer.Vector') {
                log.trace('Loading layer of type:', 'Vector', ', with source:',
                    e.source.config.url, ', using config:', e);
                const format = (e.source.config.format || 'ol.format.GeoJSON').substring('ol.format.'.length);
                const TileConfig = {
                    visible: e.visible,
                    source: new window.ol.source.Vector({
                        url: e.source.config.url,
                        format: new window.ol.format[format](e.source.config.options || {})
                    }),
                    style: new window.ol.style.Style({
                        fill: new window.ol.style.Fill(e.style.fill),
                        stroke: new window.ol.style.Stroke(e.style.stroke)
                    }),
                    opacity: e.opacity
                };
                __private.layers[i] = new window.ol.layer.Vector(TileConfig);
            } else if (e.type === 'ol.TorqueLayer') {
                log.trace('Loading layer of type:', 'Torque', ', with source:',
                    e.source, ', using config:', e);
                __private.layers[i] = new window.ol.TorqueLayer(e.source);
                __private.layers[i].options.layer = __private.layers[i];
                __private.layers[i].type = e.type;
                __private.layers[i].visible = e.visible;
            }
            __private.layers[i].wms = e.wms;
        });
        setTimeout(function () {
            // Give some time for the layers to load for the first time, and then keep checking.
            setInterval(function () {
                __private.layers.forEach(function (e, i) {
                    if (e.bingMapsSource && e.getSource().getState() !== 'ready') {
                        log.warn('Reloading BingMaps layer id:', i);
                        e.setSource(new window.ol.source.BingMaps(JSON.stringify(e.bingMapsSource.config)));
                    }
                });
            }, Constants.BING_MAPS_RELOAD_INTERVAL);
        }, Constants.OL_LOAD_WAIT_TIME);
        return __private.layers;
    };

    this.setZoom = function (zoom) {
        __private.map.getView().setZoom(zoom);
    };

    this.getZoom = function () {
        return __private.map.getView().getZoom();
    };

    this.setCenter = function (center) {
        __private.map.getView().setCenter(center);
    };

    this.getCenter = function () {
        return __private.map.getView().getCenter();
    };

    this.getTopLeft = function () {
        return __private.map.getCoordinateFromPixel([0, 0]);
    };

    this.getBottomRight = function () {
        return __private.map.getCoordinateFromPixel(__private.map.getSize());
    };

    this.getSize = function () {
        return __private.map.getSize();
    };

    this.setResolution = function (resolution) {
        __private.map.getView().setResolution(resolution);
    };

    this.getResolution = function () {
        return +(__private.map.getView().getResolution());
    };

    const showLayer = function (layer) {
        if (layer.type === 'ol.TorqueLayer') {
            layer.visible = true;
            if (__private.map) {
                layer.onAdd(__private.map);
                layer.play();
            }
        } else {
            layer.setVisible(true);
        }
    };

    this.showLayer = showLayer;

    this.hideLayer = function (layer) {
        if (layer.type === 'ol.TorqueLayer') {
            // It is important to check if the layer was already visible as if not the map and view
            // objects would not have been set on the ol.TorqueLayer.
            if (layer.visible) {
                layer.visible = false;
                if (__private.map) {
                    layer.stop();
                    layer.onRemove(__private.map);
                }
            }
        } else {
            layer.setVisible(false);
        }
    };
}
