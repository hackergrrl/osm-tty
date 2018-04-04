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
  pointstore: grid({ store: sublevel(ldb, 'geo'), zoomLevel: 8 })
})

var termsize = require('window-size')
var ansidiff = require('ansi-diff')

// var differ = ansidiff({width: termsize.width, height: termsize.height})
var charm = require('charm')()
charm.pipe(process.stdout)

var render = require('./render')
// var at = [-122.2499,37.8357130]
var at = [-154.973145, 19.585022]
var size = 0.05

var camera = {
  bbox: [
    [at[1] - size, at[1] + size],
    [at[0] - size / 0.55, at[0] + size / 0.55]
  ]
}

function redraw () {
  // expand horizontally to grab enough to fill the screen
  // var bbox = camera.bbox.slice()
  // bbox[0] = camera.bbox[0].slice()
  // bbox[1] = camera.bbox[1].slice()
  // var w = bbox[1][1] - bbox[1][0]
  // var nw = w / 0.55
  // var inc = (nw - w) / 2
  // bbox[1][0] -= inc
  // bbox[1][1] += inc

  console.time('query')
  osm.query(camera.bbox, function (err, elms) {
    console.timeEnd('query')
    console.log('res', elms.length)
    if (err) throw err
    var all = {}
    elms.sort(cmp)
    elms.forEach(function (elm) { all[elm.id] = elm })
    charm.reset()
    render(charm, camera, elms, all)
    // var output = render(camera, elms, all)
    // var aus = differ.update(output)
    // process.stdout.write(aus)
  })
}

var typeval = {
  way: 1,
  node: 0
}
function cmp (a, b) {
  return typeval[b.type] - typeval[a.type]
}

redraw()

process.stdin.setRawMode(true)
process.stdin.on('data', function (d) {
  var chr = d.toString('hex')

  var move = (camera.bbox[0][1] - camera.bbox[0][0]) * 0.1

  switch (chr) {
    /* ctrl+c */ case '03': process.exit(0)
    /* h      */ case '68': {
      camera.bbox[1][0] -= move
      camera.bbox[1][1] -= move
      redraw()
      break
    }
    /* l      */ case '6c': {
      camera.bbox[1][0] += move
      camera.bbox[1][1] += move
      redraw()
      break
    }
    /* j      */ case '6a': {
      camera.bbox[0][0] -= move
      camera.bbox[0][1] -= move
      redraw()
      break
    }
    /* k      */ case '6b': {
      camera.bbox[0][0] += move
      camera.bbox[0][1] += move
      redraw()
      break
    }
    /* i      */ case '69': {  // zoom in
      var bboxGrowthLat = (camera.bbox[0][1] - camera.bbox[0][0]) * 0.1
      var bboxGrowthLon = (camera.bbox[1][1] - camera.bbox[1][0]) * 0.1
      camera.bbox[0][0] += bboxGrowthLat
      camera.bbox[0][1] -= bboxGrowthLat
      camera.bbox[1][0] += bboxGrowthLon
      camera.bbox[1][1] -= bboxGrowthLon
      redraw()
      break
    }
    /* o      */ case '6f': {  // zoom out
      var bboxShrinkageLat = (camera.bbox[0][1] - camera.bbox[0][0]) * 0.1
      var bboxShrinkageLon = (camera.bbox[1][1] - camera.bbox[1][0]) * 0.1
      camera.bbox[0][0] -= bboxShrinkageLat
      camera.bbox[0][1] += bboxShrinkageLat
      camera.bbox[1][0] -= bboxShrinkageLon
      camera.bbox[1][1] += bboxShrinkageLon
      redraw()
      break
    }
  }
})
