# Charts App

This app supports visualisation of charts using the OVE framework. It is based on [Vega-Embed](https://github.com/vega/vega-embed), which provides support for both [Vega](https://vega.github.io/vega/) and [Vega-Lite](https://vega.github.io/vega-lite/): these are both declarative languages for interactive visualizations, but Vega-Lite is a higher level language. Vega-Embed supports Canvas and SVG rendering.

Please note that this app supports [visualisation of networks](https://vega.github.io/vega/examples/force-directed-layout/), but OVE also provides a separate [Networks App](../ove-app-networks/README.md) that is specialised for drawing node-link diagrams.

## Application State

The state of this app has a format similar to:

```json
{
    "url": "https://raw.githubusercontent.com/vega/vega/master/docs/examples/bar-chart.vg.json",
    "options": {
        "width": 800,
        "height": 800
    }
}
```

The `url` property points to a URL of a [Vega-Embed specification](https://vega.github.io/vega/docs/#specification). Alternatively, the specification be embedded in the state using a `spec` property. The optional `options` property can be used to specify the `width` and `height` of a chart.

## Launching the App

All OVE applications can be launched using the [Launcher UI](https://ove.readthedocs.io/en/stable/ove-ui/packages/ove-ui-launcher/README.html), the [Python Client Library](https://ove.readthedocs.io/en/stable/ove-sdks/python/README.html), and the OVE APIs. The API used to launch an application is the same for all applications, but the data that is passed into it is application-specific.

To launch the chart app and display a chart using the OVE APIs:

Linux/Mac:

```sh
curl --header "Content-Type: application/json" --request POST --data '{"app": {"url": "http://OVE_CORE_HOST:PORT/app/charts","states": {"load": {"url": "https://raw.githubusercontent.com/vega/vega/master/docs/examples/bar-chart.vg.json", "options": {"width": 800, "height": 800}}}}, "space": "OVE_SPACE", "h": 500, "w": 500, "y": 0, "x": 0}' http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/charts\", \"states\": {\"load\": {\"url\": \"https://raw.githubusercontent.com/vega/vega/master/docs/examples/bar-chart.vg.json\", \"options\": {\"width\": 800, \"height\": 800}}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```

The charts app has a transparent background. If required, a background colour of choice can be set using the [Background Utility](../ove-app-html/docs/UTIL_BACKGROUND.md) provided by OVE.

If the charts app is used to display static charts no further controlling would be required after the chart has been loaded. The app provides a controller that can used to control interactive charts.

## Controlling the App

The controller of the app can be loaded by accessing the URL `http://OVE_CORE_HOST:PORT/app/charts/control.html?oveSectionId=SECTION_ID`.
