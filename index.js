var fs = require('fs')

if (!process.argv[2] || !fs.existsSync(process.argv[2])) {
  console.error('USAGE: node index.js DB')
  process.exit(1)
}
var dbdir = process.argv[2]

var hyperdb = require('hyperdb')
var hyperosm = require('hyperdb-osm')
var grid = require('grid-point-store')
var level = require('level')
var sublevel = require('subleveldown')
var path = require('path')

var ldb = level(path.join(dbdir, 'level'))
var osm = hyperosm({
  db: hyperdb(path.join(dbdir, 'hyper'), { valueEncoding: 'json' }),
  index: ldb,
  pointstore: grid({ store: sublevel(ldb, 'geo') })
})

var termsize = require('window-size')
var charm = require('charm')()
charm.pipe(process.stdout)

var render = require('./render')
// var at = [-122.2499,37.8357130]
var at = [-154.973145, 19.585022]
var size = 0.05

var camera = {
  bbox: [
    [at[1] - size, at[1] + size],
    [at[0] - size, at[0] + size]
  ]
}

charm.reset()

function redraw () {
  osm.query(camera.bbox, function (err, elms) {
    elms.forEach(render.bind(null, charm, camera))
  })
}

redraw()
