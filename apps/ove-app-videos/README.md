# Videos App

[![click to play the video of the videos app](https://media.githubusercontent.com/media/ove/ove-docs/master/resources/358A4464.JPG)](https://media.githubusercontent.com/media/ove/ove-docs/master/resources/358A4462.MOV "click to play the video of the videos app")

This app supports playing videos using the OVE framework. It provides a generic player for any video (`HTML5`), a player for tiled videos in an [`.OTV` format](../ove-app-videos/docs/OTV_FILE_FORMAT.md), and a player based on the [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) (`YouTube`).

Seen above is a video of the videos app playing the [2030.wikimedia.org YouTube video in 4K resolution](https://www.youtube.com/watch?v=5CKFKyc7We4) published by the [Wikimedia Foundation](https://www.youtube.com/channel/UCgIIsBhcseFH1Kghmo0ULbA) recorded in HD resolution at the [Imperial College](http://www.imperial.ac.uk) [Data Science Institute's](http://www.imperial.ac.uk/data-science/) [Data Observatory](http://www.imperial.ac.uk/data-science/data-observatory/).

## Application State

The state of this app has a format similar to:

```json
{
    "url": "http://www.youtube.com/embed/XY3NP4JHXZ4"
}
```

The player is selected automatically based on the URL: Any YouTube URL uses the YouTube player, any URL for a file with an `.otv` extension uses the tiled video player, and all other URLs use the HTML5 player. By default, all videos will play muted. An optional property, `unmuted` can be set to `true` to play videos unmuted.

## Launching the App

All OVE applications can be launched using the [Launcher UI](https://ove.readthedocs.io/en/stable/ove-ui/packages/ove-ui-launcher/README.html), the [Python Client Library](https://ove.readthedocs.io/en/stable/ove-sdks/python/README.html), and the OVE APIs. The API used to launch an application is the same for all applications, but the data that is passed into it is application-specific.

To launch the SVG app and load a video using the OVE APIs:

Linux/Mac:

```sh
curl --header "Content-Type: application/json" --request POST --data '{"app": {"url": "http://OVE_CORE_HOST:PORT/app/videos","states": {"load": {"url": "http://www.youtube.com/embed/XY3NP4JHXZ4"}}}, "space": "OVE_SPACE", "h": 500, "w": 500, "y": 0, "x": 0}' http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/videos\", \"states\": {\"load\": {\"url\": \"http://www.youtube.com/embed/XY3NP4JHXZ4\"}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```

## Controlling the App

The controller of the app can be loaded by accessing the URL `http://OVE_CORE_HOST:PORT/app/videos/control.html?oveSectionId=SECTION_ID`.

The app's API also exposes operations such as `play`, `pause`, `stop`, `mute`, `seekTo` and `bufferStatus`. These operations can be executed on a per-video basis or across all videos.

To play videos using OVE APIs:

```sh
curl  --request POST http://OVE_CORE_HOST:PORT/app/videos/operation/play
```

Instructions on invoking other operations are available on the API Documentation, `http://OVE_CORE_HOST:PORT/app/videos/api-docs/#operation`.
