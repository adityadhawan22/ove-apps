# Audio App

This app supports the playing of audio files within the OVE Framework. It is powered by the Howler.js audio library, so supports the Web Audio API by default and falls back to HTML5 Audio if required. This app is intended to provide a distributed layer on top of the Howler Library.

The Audio App does not display any visible content and will, by default, play audio on all browsers a section covers.

The app currently supports `webm`, `mp3` and `wav` files.

## Application State

The state of this app has a format similar to:

```json
{
    "url": "https://upload.wikimedia.org/wikipedia/commons/7/74/%22Goin'_Home%22%2C_performed_by_the_United_States_Air_Force_Band.oga"
}
```

## Launching the App

All OVE applications can be launched using the [Launcher UI](https://ove.readthedocs.io/en/stable/ove-ui/packages/ove-ui-launcher/README.html), the [Python Client Library](https://ove.readthedocs.io/en/stable/ove-sdks/python/README.html), and the OVE APIs. The API used to launch an application is the same for all applications, but the data that is passed into it is application-specific.

To launch the audio app and load an audio file using the OVE APIs:

Linux/Mac:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/audio\",\"states\": {\"load\": {\"url\": \"https://upload.wikimedia.org/wikipedia/commons/7/74/%22Goin'_Home%22%2C_performed_by_the_United_States_Air_Force_Band.oga\"}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/audio\",\"states\": {\"load\": {\"url\": \"https://upload.wikimedia.org/wikipedia/commons/7/74/%22Goin'_Home%22%2C_performed_by_the_United_States_Air_Force_Band.oga\"}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```

## Controlling the App

The controller of the app can be loaded by accessing the URL `http://OVE_CORE_HOST:PORT/app/audio/control.html?oveSectionId=SECTION_ID`.

The app's API also exposes operations such as `play`, `pause`, `stop`, `seekTo` and `bufferStatus` related to playback. Volume may be controlled by operations such as `mute`, `unmute`, `volUp`, `volDown`. These operations can be executed on a per-section basis or across all sections. The position of the audio source can be set in the 3D space using the `setPosition` operation. This accepts `x`, `y` and `z` values, which should be set to be within `0.0` and `1.0` for the panning to happen within a given space. If the values are outside of this range the player will reduce the volume to provide an approximate effect.

To play audio using OVE APIs:

```sh
curl --request POST http://OVE_CORE_HOST:PORT/app/audio/operation/play
```

Instructions on invoking other operations are available on the API Documentation, `http://OVE_CORE_HOST:PORT/app/audio/api-docs/#operation`.
