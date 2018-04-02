module.exports = renderElement

var bresenham = require('bresenham')
var termsize = require('window-size')

function renderElement (charm, camera, allElements, element) {
  switch (element.type) {
    case 'node': renderNode(charm, camera, allElements, element); break
    case 'way': renderWay(charm, camera, allElements, element); break
    // default: console.log('unknown', element.type)
  }
}

function nodeToTermCoords (camera, node) {
  var horizScale = 1 //0.5
  var vertScale = 1

  var w = camera.bbox[1][1] - camera.bbox[1][0]
  var h = camera.bbox[0][1] - camera.bbox[0][0]
  var x = Math.round(((node.lon - camera.bbox[1][0]) / w) * termsize.width * horizScale)
  var y = termsize.height - Math.round(((node.lat - camera.bbox[0][0]) / h) * termsize.height * vertScale)
  return [x, y]
}

function renderNode (charm, camera, allElements, node) {
  if (!node.tags) return

  var pos = nodeToTermCoords(camera, node)
  var x = pos[0]
  var y = pos[1]
  if (x < 0 || y < 0 || x >= termsize.width || y >= termsize.height) return

  charm.position(x, y)
  charm.write('o')
}

function renderWay (charm, camera, allElements, way) {
  charm.display('bright')
  charm.foreground(color(way))

  for (var i=0; i < way.refs.length - 1; i++) {
    var n1 = allElements[way.refs[i]]
    var n2 = allElements[way.refs[i+1]]
    if (!n1 || !n2) continue
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

function color (elm) {
  var colours = [
    'red',
    'yellow',
    'green',
    'blue',
    'cyan',
    'magenta',
    // 'black',
    'white'
  ]
  n = Number(parseInt(elm.id, 16)) % colours.length
  return colours[n]
}

