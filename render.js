module.exports = renderElement

var bresenham = require('bresenham')
var termsize = require('window-size')

function renderElement (charm, camera, element) {
  switch (element.type) {
    case 'node': renderNode(charm, camera, element); break
    case 'way': renderWay(charm, camera, element); break
    // default: console.log('unknown', element.type)
  }
}

function nodeToTermCoords (camera, node) {
  var horizScale = 0.5
  var vertScale = 1

  var w = camera.bbox[1][1] - camera.bbox[1][0]
  var h = camera.bbox[0][1] - camera.bbox[0][0]
  var x = Math.round(((node.lon - camera.bbox[1][0]) / w) * termsize.width * horizScale)
  var y = termsize.height - Math.round(((node.lat - camera.bbox[0][0]) / h) * termsize.height * vertScale)
  return [x, y]
}

function renderNode (charm, camera, node) {
  if (!node.tags) return

  var pos = nodeToTermCoords(camera, node)
  var x = pos[0]
  var y = pos[1]
  if (x < 0 || y < 0 || x >= termsize.width || y >= termsize.height) return

  charm.position(x, y)
  charm.write('o')
}

function renderWay (charm, camera, way) {
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
    var p1 = nodeToTermCoords(camera, n1)
    var p2 = nodeToTermCoords(camera, n2)
    var pts = bresenham(p1[0], p1[1], p2[0], p2[1])
    for (var j=0; j < pts.length; j++) {
      var x = pts[j].x
      var y = pts[j].y
      if (x < 0 || y < 0 || x >= termsize.width || y >= termsize.height) continue
      charm.position(x, y)
      charm.write('#')
    }
  }
}

