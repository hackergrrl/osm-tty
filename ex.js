var hyperosm = require('hyperdb-osm')
var ram = require('random-access-memory')
var grid = require('grid-point-store')
var memdb = require('memdb')

var osm2obj = require('osm2obj')
var charm = require('charm')()
charm.pipe(process.stdout)
var fs = require('fs')
var render = require('./render')

var termsize = require('window-size')

var elements = {}

var at = [-122.2499,37.8357130]
var size = 0.0005

var bbox = [
  [at[0] - size, at[1] - size],
  [at[0] + size, at[1] + size]
]
// https.get('https://www.openstreetmap.org/api/0.6/map?bbox=-122.15,37.749,-122.149,37.75', function (res) {
;(function (res) {
  var camera = {
    bbox: bbox
  }

  charm.reset()

  var ts = res.pipe(osm2obj())
  ts.on('data', render.bind(null, charm, camera))
  // ts.once('error', console.log)
  ts.once('end', function () {
    charm.position(0, termsize.height)
  })
})(require('fs').createReadStream('./data.xml'))

fs.createReadStream('./data.xml')
  .pipe(osm2obj())

