# MapLayers.json File

The maps app can be configured by embedding the map layers configuration within the `config.json` file, or by providing a URL (or path) that points to a `MapLayers.json` file. The format of the JSON configuration remains the same in either of these two approaches.

The `MapLayers.json` file contains an array of map layers. There are two different configuration formats for [OpenLayers](https://openlayers.org/) and [Leaflet](https://leafletjs.com/). These as described below. The mapping library is selected according to the configuration format of the first layer and assumes all other layers follow the same format. If no layers were defined, [OpenLayers](https://openlayers.org/) will be selected as the mapping library.

By default, the `config.json` exposes layers in the [OpenLayers](https://openlayers.org/) configuration format. To use [Leaflet](https://leafletjs.com/), edit the `config.json` file and replace the `layers` property with `layers_ol` and the `layers_leaflet` property with `layers`.

## [OpenLayers](https://openlayers.org/) configuration format

The configuration format for [OpenLayers](https://openlayers.org/) has a structure similar to:

```JSON
[
    {
        "type": "ol.layer.Tile",
        "visible": false,
        "wms": false,
        "source": {
            "type": "ol.source.OSM",
            "config": {
                "crossOrigin": null,
                "url": "https://{a-c}.tile.thunderforest.com/transport/{z}/{x}/{y}.png"
            }
        }
    },
    {
        "type": "ol.layer.Vector",
        "visible": false,
        "wms": true,
        "source": {
            "type": "ol.source.Vector",
            "config": {
                "url": "data/sampleGeo.json"
            }
        },
        "style": {
            "fill": {
                "color": "#B29255"
            },
            "stroke": {
                "color": "#715E3A",
                "width": 4
            }
        },
        "opacity": 0.7
    },
    {
        "type": "ol.layer.Vector",
        "visible": false,
        "wms": true,
        "source": {
            "type": "ol.source.Vector",
            "config": {
                "format": "ol.format.TopoJSON",
                "options": {
                    "layers": ["countries"]
                },
                "url": "https://d3js.org/world-110m.v1.json"
            }
        },
        "style": {
            "fill": {
                "color": "rgba(255, 255, 255, 0.6)"
            },
            "stroke": {
                "color": "#319FD3",
                "width": 1
            }
        },
        "opacity": 0.7
    }
]
```

The library supports two types of map layers, `ol.layer.Tile` and `ol.layer.Vector`.

Both types of layer have a `visible` property that describes whether the layer is visible by default and a `wms` property which describes whether the layer is a displaying data from a [`Web Map Service`](https://www.opengeospatial.org/standards/wms). These properties have Boolean values.

The layers also have a common `source` property, but their contents differ. The `source` of a vector layer always must have a `type` equal to `ol.source.Vector`, and the `url` of the `config` property must point to a file in a supported format such as [GeoJSON](http://geojson.org/), [TopoJSON](https://github.com/topojson), [GML](https://www.opengeospatial.org/standards/gml), [KML](https://www.opengeospatial.org/standards/kml), [WKT CRS](https://www.opengeospatial.org/standards/wkt-crs), [OSM](https://wiki.openstreetmap.org/wiki/OSM_XML), [IGC](http://istitutogeograficocentrale.it/en/) or [Esri](https://www.esri.com). The `source` of a tile layer can be any [layer source for tile data supported by OpenLayers](https://geoadmin.github.io/ol3/apidoc/ol.source.html) such as [`ol.source.OSM`](https://geoadmin.github.io/ol3/apidoc/ol.source.OSM.html) or [`ol.source.BingMaps`](https://geoadmin.github.io/ol3/apidoc/ol.source.BingMaps.html). The `config` object is passed as an argument of the constructor for the specified source, and its properties depend on which source is used; more information can be found in the [OpenLayers documentation](http://geoadmin.github.io/ol3/apidoc/ol.source.html).

Unlike tile layers, vector layers have two additional properties, `style` and `opacity` which can be used to customise their appearance. The `opacity` property has a numeric value between 0 and 1, and the `style` property accepts a JSON structure with two properties (`fill` and `stroke`) within it. These correspond to configuration provided when creating [`ol.style.Fill`](http://geoadmin.github.io/ol3/apidoc/ol.style.Fill.html) and [`ol.style.Stroke`](http://geoadmin.github.io/ol3/apidoc/ol.style.Stroke.html) objects, respectively.

### Using the [CARTO](https://carto.com) platform with [OpenLayers](https://openlayers.org/)

The configuration formats for using [CARTO](https://carto.com) platform with [OpenLayers](https://openlayers.org/) have structures similar to:

```JSON
[
    {
        "type": "ol.layer.Tile",
        "visible": false,
        "wms": false,
        "source": {
            "type": "ol.source.XYZ",
            "config": {
                "url": "http://api.cartocdn.com/base-dark/{z}/{x}/{y}.png"
            }
        }
    },
    {
        "type": "ol.TorqueLayer",
        "visible": false,
        "wms": false,
        "source": {
            "user": "viz2",
            "table": "ow",
            "zIndex": 100,
            "cartocss": "Map { -torque-time-attribute: \"date\"; -torque-aggregation-function: \"count(cartodb_id)\"; -torque-frame-count: 760; -torque-animation-duration: 15; -torque-resolution: 2 } #layer {   marker-width: 3;   marker-fill-opacity: 0.8;   marker-fill: #FEE391;    comp-op: \"lighten\";   [value > 2] { marker-fill: #FEC44F; }   [value > 3] { marker-fill: #FE9929; }   [value > 4] { marker-fill: #EC7014; }   [value > 5] { marker-fill: #CC4C02; }   [value > 6] { marker-fill: #993404; }   [value > 7] { marker-fill: #662506; }   [frame-offset = 1] { marker-width: 10; marker-fill-opacity: 0.05;}   [frame-offset = 2] { marker-width: 15; marker-fill-opacity: 0.02;} }"
        }
    },
    {
        "type": "ol.layer.Tile",
        "visible": false,
        "wms": false,
        "source": {
            "type": "ol.source.CartoDB",
            "config": {
                "account": "documentation",
                "config": {
                    "layers": [{
                        "type": "cartodb",
                        "options": {
                            "cartocss_version": "2.1.1",
                            "cartocss": "#layer { polygon-fill: #1E90FF; polygon-opacity: 0.6;}",
                            "sql": "select * from european_countries_e where name = 'France'"
                        }
                    }]
                }
            }
        }
    }
]
```

The implementation supports the use of [CARTO](https://carto.com) base maps, [Torque.js](https://carto.com/developers/torque-js/) and the [CartoDB source of OpenLayers](https://openlayers.org/en/latest/apidoc/module-ol_source_CartoDB-CartoDB.html). These can be used to display base map tiles, animations and vector overlays.

The configuration of the `source` property of the `ol.TorqueLayer` type (which is similar to `L.TorqueLayer`) is explained in the [Torque.js reference documentation](https://carto.com/developers/torque-js/reference/#ltorquelayer). The configuration of the `ol.source.CartoDB` is explained in the [OpenLayers API documentation](https://openlayers.org/en/latest/apidoc/module-ol_source_CartoDB-CartoDB.html).

To see [CARTO](https://carto.com) platform examples in OVE, load the controller by accessing the URL `http://OVE_CORE_HOST:PORT/app/maps/control.html?oveSectionId=SECTION_ID&layers=2,3,4&state=World`. To learn more, see [examples on using OpenLayers with the CARTO Platform](https://openlayers.org/en/latest/examples/cartodb.html) and the [example on using Torque.js with OpenLayers](https://carto.com/developers/torque-js/examples/#example-navy).

## [Leaflet](https://leafletjs.com/) configuration format

The configuration format for [Leaflet](https://leafletjs.com/) has a structure similar to:

```JSON
[
    {
        "type": "L.tileLayer",
        "visible": false,
        "wms": false,
        "url": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.jpg"
    },
    {
        "type": "L.geoJSON",
        "visible": false,
        "wms": false,
        "data": [
        {
            "type": "LineString",
            "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
        },
        {
            "type": "LineString",
            "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
        }],
        "options": {
            "style": {
                "fill": true,
                "fillColor": "#B29255",
                "fillOpacity": 0.7,
                "color": "#715E3A",
                "weight": 4,
                "opacity": 0.7
            }
        }
    },
    {
        "type": "L.topoJSON",
        "visible": false,
        "wms": false,
        "url": "https://d3js.org/world-110m.v1.json",
        "options": {
            "style": {
                "fill": true,
                "fillColor": "#FFFFFF",
                "fillOpacity": 0.6,
                "color": "#319FD3",
                "weight": 1,
                "opacity": 0.7
            }
        }
    }
]
```

The library supports raster and vector map layers as well as [GeoJSON](http://geojson.org/) and [TopoJSON](https://github.com/topojson) layers. Unlike [OpenLayers](https://openlayers.org/), they are not grouped into two significant layers and all other vector formats must first be converted into [GeoJSON](http://geojson.org/) using a suitable converter. A complete catalogue of all [Leaflet](https://leafletjs.com/) map layers are available in their [documentation](https://leafletjs.com/reference.html#layer).

Both types of layer have a `visible` property that describes whether the layer is visible by default and a `wms` property which describes whether the layer is a displaying data from a [`Web Map Service`](https://www.opengeospatial.org/standards/wms). These properties have Boolean values.

Each layer has its own properties. `L.tileLayer` must have a `url` property. All vector layers must have a `bounds` property. `L.imageOverlay` and `L.videoOverlay` must have a `url` as well as a `bounds` property. All layers accept an optional `options` property as well. All of these combinations are explained in the [Leaflet documentation](https://leafletjs.com/reference.html#layer).

Unlike in [OpenLayers](https://openlayers.org/), [Leaflet](https://leafletjs.com/) expects [GeoJSON](http://geojson.org/) and [TopoJSON](https://github.com/topojson) to be embedded and defined using a `data` property or to be hosted externally and for the corresponding URL to be provided using the `url` property. Like other layers it also accepts an optional `options` property. The `style` property is defined within this `options` property as seen above. `opacity` is a part of the `style` property.

### Using the [CARTO](https://carto.com) platform with [Leaflet](https://leafletjs.com/)

The configuration formats for using [CARTO](https://carto.com) platform with [Leaflet](https://leafletjs.com/) have structures similar to:

```JSON
[
    {
        "type": "L.tileLayer",
        "visible": false,
        "wms": false,
        "url": "http://{s}.api.cartocdn.com/base-dark/{z}/{x}/{y}.png"
    },
    {
        "type": "L.TorqueLayer",
        "visible": false,
        "wms": false,
        "source": {
            "user": "viz2",
            "table": "ow",
            "zIndex": 100,
            "cartocss": "Map { -torque-time-attribute: \"date\"; -torque-aggregation-function: \"count(cartodb_id)\"; -torque-frame-count: 760; -torque-animation-duration: 15; -torque-resolution: 2 } #layer {   marker-width: 3;   marker-fill-opacity: 0.8;   marker-fill: #FEE391;    comp-op: \"lighten\";   [value > 2] { marker-fill: #FEC44F; }   [value > 3] { marker-fill: #FE9929; }   [value > 4] { marker-fill: #EC7014; }   [value > 5] { marker-fill: #CC4C02; }   [value > 6] { marker-fill: #993404; }   [value > 7] { marker-fill: #662506; }   [frame-offset = 1] { marker-width: 10; marker-fill-opacity: 0.05;}   [frame-offset = 2] { marker-width: 15; marker-fill-opacity: 0.02;} }"
      }
    },
    {
        "type": "L.cartoDB",
        "visible": false,
        "wms": false,
        "source": {
            "apiKey": "default_public",
            "username": "cartojs-test",
            "layers": [{
                "cartocss": "#layer { marker-width: 7; marker-fill: #EE4D5A; marker-line-color: #FFFFFF; }",
                "sql": "SELECT * FROM ne_10m_populated_places_simple WHERE adm0name = 'United Kingdom'"
            }]
        }
    }
]
```

The implementation supports the use of [CARTO](https://carto.com) base maps, [Torque.js](https://carto.com/developers/torque-js/) and [CARTO.js](https://carto.com/developers/carto-js/). These can be used to display base map tiles, animations and vector overlays.

The configuration of the `source` property of the `L.TorqueLayer` type is explained in the [Torque.js reference documentation](https://carto.com/developers/torque-js/reference/#ltorquelayer). The `source` property of the `L.cartoDB` type includes the `apiKey` and `username` required by the [CARTO.js client](https://carto.com/developers/carto-js/reference/#cartoclient) and a `layers` property which defines a list of [carto.layer.Layer objects](https://carto.com/developers/carto-js/reference/#cartolayerlayer).

To see [CARTO](https://carto.com) platform examples in OVE, load the controller by accessing the URL `http://OVE_CORE_HOST:PORT/app/maps/control.html?oveSectionId=SECTION_ID&layers=2,3,4&state=World`. To learn more, see [examples on using CARTO.js](https://carto.com/developers/carto-js/examples/) and the [example on using Torque.js with Leaflet](https://carto.com/developers/torque-js/examples/#example-navy-ships-leaflet).
