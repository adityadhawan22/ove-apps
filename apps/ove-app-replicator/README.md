# Replicator App

This app is capable of replicating content from an OVE `space` (or a portion of a space), a `group` or one or more individual `sections`. The displayed content may be replicated from either from the same OVE instance as the replicator app, or a remote instance. It can render content at different pixel dimensions by scaling whilst preserving retaining the same aspect ratios.

The replicator app is instantiated just like any other app. However, it does not have a controller, and therefore behaves slightly differently to other apps at runtime.

## Application State

The state of this app has a format similar to:

```json
{
    "mode": "space",
    "spaceName": "LocalNine",
    "groupIds": [0, 1],
    "sectionIds": [2, 3, 4],
    "crop": {
        "x": 0,
        "y": 0,
        "w": 100,
        "h": 100,
    },
    "oveHost": "localhost:8080",
    "border": "solid gold",
    "background": "#222"
}
```

### Selecting what to replicate

The `mode` property is mandatory and should have a value of `space`, `group`, or `section`.

If the `mode` has been set to `space`, the `spaceName` property should generally be provided. It must be set if content is replicated from a remote OVE instance, and will otherwise default to the name of the space in which the replicator section is created (creating a mini-map view of the space).

If the `mode` is `group`, then the `groupIds` property must be provided.

If the `mode` is `section`, then the `sectionIds` property must be provided.

If the `mode` is `group` or `section`, then the `spaceName` property will default to the name of the space that contains the most sections.

The optional `oveHost` property can be set in order to connect to a remote OVE instance; if it is not set, content will be replicated from the same OVE instance that the replicator app is created on.

Regardless of which `mode` is used, the optional `crop` property can be set: this defines a rectangular region, and nothing outside this region is replicated. The contents of the region selected by `spaceName`/`groupIds`/`sectionIds` will be scaled proportionally so that the crop rectangle fits within the replicator app's own dimensions (defined as `w` and `h` of the geometry when creating the app).

The optional `border` property can be used to set the [border-style](https://developer.mozilla.org/en-US/docs/Web/CSS/border-style) and [border-color](https://developer.mozilla.org/en-US/docs/Web/CSS/border-color) (but not border-width) of the replicated region. This can be useful when the replication is deployed as an overlay (for example, as a mini-map).

Setting a `border` will also make the replicator app's background opaque. The optional `background` property can be set to change the colour and the opacity of the background.

## Launching the App

All OVE applications can be launched using the [Launcher UI](https://ove.readthedocs.io/en/stable/ove-ui/packages/ove-ui-launcher/README.html), the [Python Client Library](https://ove.readthedocs.io/en/stable/ove-sdks/python/README.html), and the OVE APIs. The API used to launch an application is the same for all applications, but the data that is passed into it is application-specific.

To replicate content using the OVE APIs:

```sh
curl --header "Content-Type: application/json" --request POST --data '{"app": {"url": "http://OVE_CORE_HOST:PORT/app/replicator","states": {"load": {"mode": "space", "spaceName": "LocalNine"}}}, "space": "OVE_SPACE", "h": 500, "w": 500, "y": 0, "x": 0}' http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/replicator\", \"states\": {\"load\": {\"mode\": \"space\", \"spaceName\": \"LocalNine\"}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```
