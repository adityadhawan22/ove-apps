# SVG App

![photograph of the SVG app](https://media.githubusercontent.com/media/ove/ove-docs/master/resources/358A4421.JPG "photograph of the SVG app")

This app supports rendering SVG using the OVE framework. It is based on [Tuoris](https://github.com/fvictor/tuoris), a middleware for distributed SVG rendering. An installation of [Tuoris](https://github.com/fvictor/tuoris) is required to use the SVG app. More information on installing [Tuoris](https://github.com/fvictor/tuoris) can be found in the [OVE installation guide](https://ove.readthedocs.io/en/stable/docs/INSTALLATION.html).

The SVG app depends on an environment variable named `TUORIS_HOST`, that points to the URL at which the Tuoris instance runs.

Seen above is an image of the SVG app displaying the [Les Misérables co-occurrence matrix diagram by Mike Bostok](https://bost.ocks.org/mike/miserables/) photographed at the [Imperial College](http://www.imperial.ac.uk) [Data Science Institute's](http://www.imperial.ac.uk/data-science/) [Data Observatory](http://www.imperial.ac.uk/data-science/data-observatory/).

## Application State

The state of this app has a format similar to:

```json
{
    "url": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Trajans-Column-lower-animated.svg"
}
```

## Launching the App

All OVE applications can be launched using the [Launcher UI](https://ove.readthedocs.io/en/stable/ove-ui/packages/ove-ui-launcher/README.html), the [Python Client Library](https://ove.readthedocs.io/en/stable/ove-sdks/python/README.html), and the OVE APIs. The API used to launch an application is the same for all applications, but the data that is passed into it is application-specific.

To launch the SVG app and display an SVG using the OVE APIs:

Linux/Mac:

```sh
curl --header "Content-Type: application/json" --request POST --data '{"app": {"url": "http://OVE_CORE_HOST:PORT/app/svg","states": {"load": {"url": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Trajans-Column-lower-animated.svg"}}}, "space": "OVE_SPACE", "h": 500, "w": 500, "y": 0, "x": 0}' http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/svg\", \"states\": {\"load\": {\"url\": \"https://upload.wikimedia.org/wikipedia/commons/6/6c/Trajans-Column-lower-animated.svg\"}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```

The SVG app has a transparent background. If required, a background colour of choice can be set using the [Background Utility](../ove-app-html/docs/UTIL_BACKGROUND.md) provided by OVE.

If the SVG app is used to display static SVGs no further controlling would be required after the SVG has been loaded. The app provides a controller that can used to control interactive SVGs.

## Controlling the App

The controller of the app can be loaded by accessing the URL `http://OVE_CORE_HOST:PORT/app/svg/control.html?oveSectionId=SECTION_ID`.
