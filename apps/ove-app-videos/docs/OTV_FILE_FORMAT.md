# .OTV File Format

The `.OTV` (`OVE Tiled Video`) file format can be used to load a tiled video using the videos app. This file needs to have a structure similar to:

```JSON
{
  "width": 7680,
  "height": 4320,
  "rows": 4,
  "cols": 4,
  "format": "mp4"
}
```

The `width` and the `height` properties describes the total width and height of all video tiles. The `rows` and `cols` properties describes the number rows and columns that are available within these bounds (or the number of tiles, in other words). The `format` property describes the file format of the videos. The above example defines a 8K video in a 16:9 aspect ratio with each tile in HD quality.

In addition to this file, the video player expects the list of videos to be available in a folder alongside it. The name of the folder is of a specific format - for a file named `FILENAME.otv` the folder must be `FILENAME_files`. Within this folder, there must be a sub-folder named `0`. This path segment is intended to specify a zoom-level for future versions of the tiled video player but is currently not used and must always be `0`. Within this sub-folder the corresponding video tiles must be provided in a `COLUMN_ROW.FORMAT`. In the above example, the video `0_0.mp4` represents the tile at the top-left and the video `3_3.mp4` represents the tile at the bottom-right.
