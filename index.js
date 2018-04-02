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

function redraw () {
  charm.reset()
  osm.query(camera.bbox, function (err, elms) {
    elms.forEach(render.bind(null, charm, camera))
  })
}

redraw()

process.stdin.setRawMode(true)
process.stdin.on('data', function (d) {
  var chr = d.toString('hex')

  console.log(chr)
  switch (chr) {
    /* ctrl+c */ case '03': process.exit(0)
    /* h      */ case '68': {
      camera.bbox[1][0] -= 0.003
      camera.bbox[1][1] -= 0.003
      redraw()
      break
    }
    /* l      */ case '6c': {
      camera.bbox[1][0] += 0.003
      camera.bbox[1][1] += 0.003
      redraw()
      break
    }
    /* j      */ case '6a': {
      camera.bbox[0][0] -= 0.003
      camera.bbox[0][1] -= 0.003
      redraw()
      break
    }
    /* k      */ case '6b': {
      camera.bbox[0][0] += 0.003
      camera.bbox[0][1] += 0.003
      redraw()
      break
    }
  }
})
