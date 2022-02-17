# Networks App

![photograph of the networks app](https://media.githubusercontent.com/media/ove/ove-docs/master/resources/358A4335.JPG "photograph of the networks app")

This app supports visualisation of networks with node-link diagrams using the OVE framework. It is based on [Sigma](http://sigmajs.org/), a JavaScript library dedicated to drawing graphs. This supports datasets specified in Sigma's JSON format or [GEXF](https://gephi.org/gexf/format/). Sigma supports Canvas, SVG and WebGL rendering.

Seen above is an image of the networks app displaying a [network topology graph](https://www.imperial.ac.uk/business-school/department-news/imperial-business-analytics/understanding-cyber-attacks-a-keystroke-in-a-haystack/) photographed at the [Imperial College](http://www.imperial.ac.uk) [Data Science Institute's](http://www.imperial.ac.uk/data-science/) [Data Observatory](http://www.imperial.ac.uk/data-science/data-observatory/).

## Application State

The state of this app has a format similar to:

```json
{
    "jsonURL": "data/sample.json",
    "settings": {
        "autoRescale": true,
        "clone": false,
        "defaultNodeColor": "#ec5148"
    },
    "renderer": "canvas"
}
```

The `jsonURL` property should be replaced with with `gexfURL` property depending on the format in which the dataset is specified. Optionally, a `url` property can be set instead of the `jsonURL` and `gexfURL` properties. Based on its extension, it will be used to set either of the `jsonURL` and `gexfURL` properties. If it had no extension at all, it will be ignored.

Information on all available `settings` can be found in [Sigma documentation](https://github.com/jacomyal/sigma.js/wiki/Settings). The `renderer` property is optional and defaults to `webgl`.

If the content is available on a [Neo4j](https://neo4j.com/docs) database the state of this app needs to have a format similar to:

```json
{
    "neo4j": {
        "x": { "min": 0, "max": 100 },
        "y": { "min": 0, "max": 100 },
        "db": { "url": "http://localhost:7474", "user": "neo4j", "password": "admin" },
        "query": "MATCH (n) WHERE n.y >= Y_MIN AND n.y < Y_MAX AND n.x >= X_MIN AND n.x < X_MAX RETURN n LIMIT 100"
      },
    "settings": {
        "autoRescale": true,
        "clone": false,
        "rescaleIgnoreSize": true,
        "skipErrors": true
    },
    "renderer": "canvas"
}
```

A [Cypher](https://neo4j.com/docs/cypher-refcard/current/) query should be provided as the `query` along with the database connection details as the value of the `db` property. The `min` and `max` values along the `x` and `y` axes also needs to be provided if the graph coordinates does not map to pixel coordinates on the screens.

The optional `boundingBoxColor` property specifies the colour of the bounding box. The optional `boundingBoxNodeSize` property specifies the size of the nodes used to draw the bounding box. The optional `disableTiling` disables tiling of the graph on a per-client basis. The optional `overlap` property defines the amount of overlap between adjacent clients as a percentage of the clients height/width and defaults to `1` percent. All these properties must be defined within the `neo4j` property.

Information on all available `settings` can be found in [Sigma documentation](https://github.com/jacomyal/sigma.js/wiki/Settings). The `renderer` property is optional and defaults to `webgl`.

## Launching the App

All OVE applications can be launched using the [Launcher UI](https://ove.readthedocs.io/en/stable/ove-ui/packages/ove-ui-launcher/README.html), the [Python Client Library](https://ove.readthedocs.io/en/stable/ove-sdks/python/README.html), and the OVE APIs. The API used to launch an application is the same for all applications, but the data that is passed into it is application-specific.

To launch the networks app and display a node-link diagram using the OVE APIs:

Linux/Mac:

```sh
curl --header "Content-Type: application/json" --request POST --data '{"app": {"url": "http://OVE_CORE_HOST:PORT/app/networks","states": {"load": {"jsonURL": "data/sample.json", "settings": { "autoRescale": true, "clone": false, "defaultNodeColor": "#ec5148"}, "renderer": "canvas"}}}, "space": "OVE_SPACE", "h": 500, "w": 500, "y": 0, "x": 0}' http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/networks\", \"states\": {\"load\": {\"jsonURL\": \"data/sample.json\", \"settings\": { \"autoRescale\": true, \"clone\": false, \"defaultNodeColor\": \"#ec5148\"}, \"renderer\": \"canvas\"}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```

The networks app has a transparent background. If required, a background colour of choice can be set using the [Background Utility](../ove-app-html/docs/UTIL_BACKGROUND.md) provided by OVE.

If the networks app is used to display static networks no further controlling would be required after the node-link diagram has been loaded. The app provides a controller and exposes API that can used to control interactive graphs.

## Controlling the App

The controller of the app can be loaded by accessing the URL `http://OVE_CORE_HOST:PORT/app/networks/control.html?oveSectionId=SECTION_ID`.

The app's API also exposes operations such as `showOnly`, `color`, `labelNodes`, `neighborsOf` and `reset`. These operations can be executed on a per-network basis or across all networks.

The implementation makes it possible to query on all properties of nodes and edges. The filters used must confirm to the [OData v3.0 specification](https://www.odata.org/documentation/odata-version-3-0/odata-version-3-0-core-protocol/#thefiltersystemqueryoption) and the colors used must have the format `rgb(x, y, z)` or `rgba(x, y, z, a)`, where x, y, z are integers in the range 0-255 and a is a number between 0.0 (fully transparent) and 1.0 (fully opaque).

[Sigma](http://sigmajs.org/) supports chaining of multiple filters and operations such as `showOnly` and `color` operations combine node and edge filters if provided together: which has the effect of a logical AND.

To show only the nodes having a size greater than or equal to 2, using OVE APIs:

```sh
curl  --request POST http://OVE_CORE_HOST:PORT/app/networks/operation/showOnly?filter=size%20ge%202
```

To reset the network to its original state:

```sh
curl  --request POST http://OVE_CORE_HOST:PORT/app/networks/operation/reset
```

Instructions on invoking all operations are available on the API Documentation, `http://OVE_CORE_HOST:PORT/app/networks/api-docs/#operation`.
