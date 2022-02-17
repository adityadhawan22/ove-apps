# Background Utility

If a web page or an app has a transparent background by design, a background colour of choice can be set using this utility:

Linux/Mac:

```sh
curl --header "Content-Type: application/json" --request POST --data '{"app": {"url": "http://OVE_CORE_HOST:PORT/app/html","states": {"load": {"url": "http://OVE_CORE_HOST:PORT/app/html/data/background/index.html?background=COLOUR"}}}, "space": "OVE_SPACE", "h": 500, "w": 500, "y": 0, "x": 0}' http://OVE_CORE_HOST:PORT/section
```

Windows:

```sh
curl --header "Content-Type: application/json" --request POST --data "{\"app\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/html\", \"states\": {\"load\": {\"url\": \"http://OVE_CORE_HOST:PORT/app/html/data/background/index.html?background=COLOUR\"}}}, \"space\": \"OVE_SPACE\", \"h\": 500, \"w\": 500, \"y\": 0, \"x\": 0}" http://OVE_CORE_HOST:PORT/section
```

The background colour can be specified either as [a keyword or hexadecimal value](https://developer.mozilla.org/en-US/docs/Web/CSS/background-color) such as `Black` or `#f0f0f0`.
