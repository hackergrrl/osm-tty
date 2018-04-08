# osm-tty

> interactive offline OpenStreetMap viewer in the terminal

Uses [hyperdb-osm](https://github.com/digidem/hyperdb-osm) and also [osm-grab](https://github.com/noffle/osm-grab) for downloading OSM XML to feed into the database.

<center><img src="https://github.com/noffle/osm-tty/raw/master/screenshot.png"/></center>

## setup

```
$ mkdir /tmp/mapz
$ cd /tmp/mapz

$ npm i -g osm-tty osm-grab

$ osm-grab osm-grab 37.81263 -122.26640 0.2 > oakland.xml

$ osm-tty import db oakland.xml
$ osm-tty db
```

`hjkl` keys to pan, `io` to zoom in and out.

It's pretty janky, and I only wrote render rules for a small subset of OSM features, but it's not bad for rudimentary offline navigation!

## License

ISC

