# QR Code App

This app supports displaying the display of [QR codes](https://en.wikipedia.org/wiki/QR_code) using the OVE framework.



## Application State

The state of this app has a format similar to:

```json
{
    "url": "http://my.domain"
}
```

The `url`, property is mandatory, and this value is encoded within the QR code.

A number of optional parameters may optionally be provided:

* `background`: Background color of the QR code (defaults to `"white"`)
* `backgroundAlpha`: Background alpha of the QR code (defaults to `1.0`)
* `foreground`: Foreground color of the QR code (defaults to `"black"`)
* `foregroundAlpha`:  Foreground alpha of the QR code (defaults to `1.0`)
* `level`: 	Error correction level of the QR code (L, M, Q, H; defulats to `"L"`)
* `padding`: Padding for the QR code in pixels (defaults to `null`) 
* `size`:  Size of the QR code in pixels (defaults to `100`)

The [qrious](https://github.com/neocotic/qrious) library is used to draw the QR codes.

## Launching the App

All OVE applications can be launched using the [Launcher UI](https://ove.readthedocs.io/en/stable/ove-ui/packages/ove-ui-launcher/README.html), the [Python Client Library](https://ove.readthedocs.io/en/stable/ove-sdks/python/README.html), and the OVE APIs. The API used to launch an application is the same for all applications, but the data that is passed into it is application-specific.

To launch the QR Code app and display a QR Code using the OVE APIs:

Linux/Mac:

```sh
curl --header "Content-Type: application/json" --request POST --data '{"app": {"url": "http://OVE_CORE_HOST:PORT/app/html","states": {"load": {"url": "http://my.domain"}}}, "space": "OVE_SPACE", "h": 500, "w": 500, "y": 0, "x": 0}' http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/html\", \"states\": {\"load\": {\"url\": \"http://my.domain\"}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```
