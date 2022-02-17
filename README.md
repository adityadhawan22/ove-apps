# Open Visualisation Environment - Apps

There are several applications designed to run within [Open Visualisation Environment (OVE)](https://github.com/ove/ove):

- [Alignment](packages/ove-app-alignment/README.md) - helps align the monitors in an OVE installation.
- [Audio](packages/ove-app-audio/README.md) - supports the playing of audio files within the OVE Framework.
- [Charts](packages/ove-app-charts/README.md) - supports visualisation of charts using the OVE framework.
- [Controller](packages/ove-app-controller/README.md) - a unified controller for all OVE apps
- [HTML](packages/ove-app-html/README.md) - supports displaying HTML web pages using the OVE framework.
- [Images](packages/ove-app-images/README.md) - supports the display of images using the OVE framework.
- [Maps](packages/ove-app-maps/README.md) - supports visualisation of dynamic maps using the OVE framework.
- [Networks](packages/ove-app-networks/README.md) - supports visualisation of networks with node-link diagrams using the OVE framework.
- [PDF](packages/ove-app-pdf/README.md) - supports displaying PDF documents using the OVE framework.
- [QR code](packages/ove-app-qrcode/README.md) - displays a QR code using the OVE framework.
- [Replicator](packages/ove-app-replicator/README.md) - replicating content of an OVE installation.
- [SVG](packages/ove-app-svg/README.md) - supports rendering SVG using the OVE framework.
- [Videos](packages/ove-app-videos/README.md) - supports playing videos using the OVE framework.
- [WebRTC](packages/ove-app-webrtc/README.md) - supports videoconferencing and screen sharing using the OVE framework.
- [Whiteboard](packages/ove-app-whiteboard/README.md) - creates a whiteboard that can be used within the OVE framework.

OVE needs to be installed before using OVE apps. The [OVE Documentation](https://ove.readthedocs.io/en/stable/) provides [installation instructions](https://ove.readthedocs.io/en/stable/docs/INSTALLATION.html) and a [user guide](https://ove.readthedocs.io/en/stable/docs/USAGE.html).

### Running individual app

```
nx r <app-name>:serve
```

Example:

```
nx r ove-app-images:serve
```

### Running all apps in dev

```
yarn serve
```

### Building

```
yarn build
```

### Running on Production

After building run the following command to start all apps

```
yarn start
```
