# Images App

![photograph of the images app](https://media.githubusercontent.com/media/ove/ove-docs/master/resources/358A4318.JPG "photograph of the images app")

This app supports the display of images using the OVE framework. It is based on [OpenSeadragon](https://openseadragon.github.io/) and supports high resolution zoomable images. These images can be of any format OpenSeadragon supports such as [Deep Zoom Image (DZI)](https://openseadragon.github.io/examples/tilesource-dzi/) or [Simple Image](https://openseadragon.github.io/examples/tilesource-image/).

This app does not support animated GIFs, and only the first frame of an animated GIF will be displayed; however, if the URL of an animated GIF is provided directly to the [HTML App](../ove-app-html/README.md), then it will play correctly.

Seen above is an image of the images app displaying the [In2White Mont Blanc HD panorama](http://www.in2white.com/about/) DZI photographed at the [Imperial College](http://www.imperial.ac.uk) [Data Science Institute's](http://www.imperial.ac.uk/data-science/) [Data Observatory](http://www.imperial.ac.uk/data-science/data-observatory/).

## Application State

The state of this app has a format similar to:

```json
{
    "tileSources": "https://openseadragon.github.io/example-images/highsmith/highsmith.dzi"
}
```

The `tileSources` property points to a [DZI file](https://docs.microsoft.com/en-us/previous-versions/windows/silverlight/dotnet-windows-silverlight/cc645077(v=vs.95)) and could be of an XML or JSON format as explained in the [OpenSeadragon documentation](https://openseadragon.github.io/examples/tilesource-dzi/).

Optionally, a `url` property can be set instead of the `tileSources` property. If it had an extension of `.dzi`, `.xml` or `.json` the `tileSources` property will be set to point to this URL. If the URL had any other extension or had no extension at all, it will be assumed to be a simple image.

The app also supports alternative types of content using other types of [tile sources supported by OpenSeadragon](https://openseadragon.github.io/#examples-and-features).

## Launching the App

All OVE applications can be launched using the [Launcher UI](https://ove.readthedocs.io/en/stable/ove-ui/packages/ove-ui-launcher/README.html), the [Python Client Library](https://ove.readthedocs.io/en/stable/ove-sdks/python/README.html), and the OVE APIs. The API used to launch an application is the same for all applications, but the data that is passed into it is application-specific.

To launch the images app and display an image using the OVE APIs:

Linux/Mac:

```sh
curl --header "Content-Type: application/json" --request POST --data '{"app": {"url": "http://OVE_CORE_HOST:PORT/app/images","states": {"load": {"tileSources": "https://openseadragon.github.io/example-images/highsmith/highsmith.dzi"}}}, "space": "OVE_SPACE", "h": 500, "w": 500, "y": 0, "x": 0}' http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/images\", \"states\": {\"load\": {\"tileSources\": \"https://openseadragon.github.io/example-images/highsmith/highsmith.dzi\"}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```

The images app has a transparent background. If required, a background colour of choice can be set using the [Background Utility](../ove-app-html/docs/UTIL_BACKGROUND.md) provided by OVE.

## Controlling the App

The controller of the app can be loaded by accessing the URL `http://OVE_CORE_HOST:PORT/app/images/control.html?oveSectionId=0`. The controller supports panning and zooming of images.
