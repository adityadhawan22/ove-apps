# Maps App

![photograph of the maps app](https://media.githubusercontent.com/media/ove/ove-docs/master/resources/358A4315.JPG "photograph of the maps app")

This app supports visualisation of dynamic maps using the OVE framework. It gives users the option of using either [OpenLayers](https://openlayers.org/) or [Leaflet](https://leafletjs.com/) as the underlying mapping library and supports tiled map layers (from Bing, OSM, etc), the [CARTO](https://carto.com) platform, vector data described in formats such as [GeoJSON](http://geojson.org/) and [TopoJSON](https://github.com/topojson) and custom overlays built using JavaScript libraries such as [D3.js](https://d3js.org/). The [OpenLayers](https://openlayers.org/) mapping library also supports the vector data formats specified by the [Open Geospatial Consortium](http://www.opengeospatial.org/), such as [GML](https://www.opengeospatial.org/standards/gml), [KML](https://www.opengeospatial.org/standards/kml) and [WKT CRS](https://www.opengeospatial.org/standards/wkt-crs) as well as proprietary formats such as [OSM](https://wiki.openstreetmap.org/wiki/OSM_XML), [IGC](http://istitutogeograficocentrale.it/en/) and [Esri](https://www.esri.com).

The maps app depends on a [Map Layers configuration](../ove-app-maps/docs/MAP_LAYERS_JSON.md) that can be provided within the `config.json` file (either embedded or as a URL), as an environment variable named `OVE_MAPS_LAYERS` that points to a URL, or by embedding it within a `Map Configuration` file.

Seen above is an image of the maps app displaying the [ArcGIS world topographic map](https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer) photographed at the [Imperial College](http://www.imperial.ac.uk) [Data Science Institute's](http://www.imperial.ac.uk/data-science/) [Data Observatory](http://www.imperial.ac.uk/data-science/data-observatory/).

## Map Configuration file

A Map Configuration file has a JSON format similar to:

```json
{
    "layers": [
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
        }
    ],
    "center": ["-11137.70850550061", "6710544.04980525"],
    "resolution": "77",
    "zoom": "12"
}
```

The `layers`, which is an optional property, must be defined according to [Map Layers configuration](../ove-app-maps/docs/MAP_LAYERS_JSON.md). If this is not provided, the default layers would be used. The `center`, `resolution` and `zoom` properties are mandatory.

## Application State

The state of this app has a format similar to:

```json
{
    "center": ["-11137.70850550061", "6710544.04980525"],
    "resolution": "77",
    "zoom": "12",
    "enabledLayers":["23"],
    "scripts":["http://my.domain/customLayer.js"]
}
```

The `center`, `resolution` and `zoom` properties are mandatory. It is also possible to store these properties in a file with a `.json` extension and provide its location using the optional `url` property. If the `url` property is provided, `center`, `resolution` and `zoom` can be omitted from the state configuration. The `url` property must refer to a `Map Configuration` file explained above.

Optionally, there can be one or more enabled layers and one or more scripts to load custom overlays as seen above. The `enabledLayers` property accepts a list of integer values. These integer values correspond to the order (starting from 0) in which the layers were defined on the [Map Layers configuration](../ove-app-maps/docs/MAP_LAYERS_JSON.md).

The `scripts` property accepts a list of URLs of JavaScript files.

## Designing Custom Overlays

Custom overlays for the maps app are loaded using a single script as explained above in the [Application State](#application-state) section. However, there may be the requirement to load multiple dependent JavaScript libraries, and also other resources such as datasets and CSS files. The example below shows what a typical `customLayer.js` should look like.

```JavaScript
let transformURL;

(function () {
    if (!window.customLayer) {
        let js_files = ["https://d3js.org/d3.v5.min.js", "./script.js"];
        let css_files = ["./customLayer.css"];

        transformURL = function(url) {
            if (url.startsWith('./')) {
                return getHostName(true, 'customLayer.js') + '/' + url.slice(2);
            } else {
                return url;
            }
        };

        js_files = js_files.map(transformURL);
        css_files = css_files.map(transformURL);

        const first = $('script:first');

        js_files.forEach(function (e) {
            $('<script>', {src: e}).insertBefore(first);
        });

        css_files.forEach(function (e) {
            $('<link>', {href: e, rel: "stylesheet", type: "text/css"}).insertBefore(first);
        });

        setTimeout(function () {
            window.map = window.ove.context.map;
            init();
        }, 2000);

        window.customLayer = true;

        function getHostName (withScheme, scriptName) {
            let scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].src.indexOf(scriptName) > 0) {
                    return scripts[i].src.substring(
                        withScheme ? 0 : scripts[i].src.indexOf('//') + 2,
                        scripts[i].src.lastIndexOf('/'));
                }
            }
            return undefined;
        };
    }
})();
```

## Launching the App

All OVE applications can be launched using the [Launcher UI](https://ove.readthedocs.io/en/stable/ove-ui/packages/ove-ui-launcher/README.html), the [Python Client Library](https://ove.readthedocs.io/en/stable/ove-sdks/python/README.html), and the OVE APIs. The API used to launch an application is the same for all applications, but the data that is passed into it is application-specific.

To launch the maps app and display a map using the OVE APIs:

Linux/Mac:

```sh
curl --header "Content-Type: application/json" --request POST --data '{"app": {"url": "http://OVE_CORE_HOST:PORT/app/maps","states": {"load": {"center": ["-11137.70850550061", "6710544.04980525"], "resolution": "77", "zoom": "12", "enabledLayers":["23"], "scripts":["http://my.domain/customLayer.js"]}}}, "space": "OVE_SPACE", "h": 500, "w": 500, "y": 0, "x": 0}' http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/maps\", \"states\": {\"load\": {\"center\": [\"-11137.70850550061\", \"6710544.04980525\"], \"resolution\": \"77\", \"zoom\": \"12\", \"enabledLayers\":[\"23\"], \"scripts\":[\"http://my.domain/customLayer.js\"]}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```

## Controlling the App

The controller of the app can be loaded by accessing the URL `http://OVE_CORE_HOST:PORT/app/maps/control.html?oveSectionId=SECTION_ID&layers=23`. The `layers` parameter in the URL is optional and can have more than one value at a time separated by commas. The controller supports panning and zooming of maps.

## Key considerations when using the App

All considerations when using this app are directly related to its reliability and performance:

1. The maps app tends to load many tiles on screens with higher resolutions and tile servers that are slow and remote tend to perform very poorly compared to servers that are much faster and locally hosted.
2. JavaScript executed to load custom overlays must not introduce any performance bottlenecks or execute code that has a negative impact on the reliability of OVE.
3. If the [Map Layers configuration](../ove-app-maps/docs/MAP_LAYERS_JSON.md) is specified as a URL (rather than being directly embedded in the `config.json` file), then this must be available before the server-side of this app is launched using PM2 or Docker.
