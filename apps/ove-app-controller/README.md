# Controller App

This app is a unified controller for all OVE apps. It makes use of transformation APIs exposed by OVE apps and supports common pan and zoom operations.

## Application State

The state of this app has a format similar to:

```json
{
    "mode": "group",
    "groupId": "1",
    "showTouch": true
}
```

The `mode` property is mandatory and should have a value of `space`, `group` or `geometry`. The `groupId` property is optional, and must only be provided if `mode` is `group`. The `showTouch` property can be used to specify whether the Touch overlay is enabled for the viewers.

The app will assume control of the entire `space` if the `mode` is set to `space`. But, if the mode is `geometry` it will however be limited to the geometry defined by the `x`, `y`, `w` and `h` properties set when creating the app. In both cases, the visible area of the controllers and the touch surfaces, would be limited to the `x`, `y`, `w` and `h` properties set when creating the app.

## Launching the App

All OVE applications can be launched using the [Launcher UI](https://ove.readthedocs.io/en/stable/ove-ui/packages/ove-ui-launcher/README.html), the [Python Client Library](https://ove.readthedocs.io/en/stable/ove-sdks/python/README.html), and the OVE APIs. The API used to launch an application is the same for all applications, but the data that is passed into it is application-specific.

To launch the controller app using the OVE APIs:

```sh
curl --header "Content-Type: application/json" --request POST --data '{"app": {"url": "http://OVE_CORE_HOST:PORT/app/controller","states": {"load": {"mode": "space"}}}, "space": "OVE_SPACE", "h": 500, "w": 500, "y": 0, "x": 0}' http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/controller\", \"states\": {\"load\": {\"mode\": \"space\"}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```

## Controlling the App

The controller of the app can be loaded by accessing the URL `http://OVE_CORE_HOST:PORT/app/controller/control.html?oveSectionId=SECTION_ID`. The controller supports panning and zooming operations.
