var https = require('https')
var osm2obj = require('osm2obj')
var bresenham = require('bresenham')
var charm = require('charm')()
charm.pipe(process.stdout)

var elements = {}

var bbox = [
  [-122.15, 37.749],
  [-122.149, 37.75]
]
https.get('https://www.openstreetmap.org/api/0.6/map?bbox=-122.15,37.749,-122.149,37.75', function (res) {
  var camera = {
    bbox: bbox
  }

  charm.reset()

  var ts = res.pipe(osm2obj())
  ts.on('data', renderElement.bind(null, camera))
  // ts.once('error', console.log)
  ts.once('end', function () {
    charm.position(0, 25)
  })
})

function renderElement (camera, element) {
  elements[element.id] = element

  switch (element.type) {
    case 'node': renderNode(camera, element); break
    case 'way': renderWay(camera, element); break
    // default: console.log('unknown', element.type)
  }
}

function nodeToTerm (camera, node) {
  var horizScale = 0.5
  var vertScale = 1

  var w = camera.bbox[1][0] - camera.bbox[0][0]
  var h = camera.bbox[1][1] - camera.bbox[0][1]
  var x = Math.round(((node.lon - camera.bbox[0][0]) / w) * 80 * horizScale)
  var y = 24 - Math.round(((node.lat - camera.bbox[0][1]) / h) * 24 * vertScale)
  return [x, y]
}

function renderNode (camera, node) {
  if (node.tags) return

  var pos = nodeToTerm(camera, node)
  var x = pos[0]
  var y = pos[1]
  if (x < 0 || y < 0 || x >= 80 || y >= 24) return

  charm.position(x, y)
  charm.write('o')
}

function renderWay (camera, way) {
  charm.display('bright')
  var colours = [
    'red',
    'yellow',
    'green',
    'blue',
    'cyan',
    'magenta',
    'black',
    'white'
  ] 
  charm.foreground(colours[Math.floor(Math.random() * colours.length)])

  for (var i=0; i < way.nodes.length - 1; i++) {
    var n1 = elements[way.nodes[i]]
    var n2 = elements[way.nodes[i+1]]
    var p1 = nodeToTerm(camera, n1)
    var p2 = nodeToTerm(camera, n2)
    var pts = bresenham(p1[0], p1[1], p2[0], p2[1])
    for (var j=0; j < pts.length; j++) {
      var x = pts[j].x
      var y = pts[j].y
      if (x < 0 || y < 0 || x >= 80 || y >= 24) continue
      charm.position(x, y)
      charm.write('.')
    }
  }
}
