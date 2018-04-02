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

  if (node.tags.noexit) return

  var label
  if (node.tags.name) label = node.tags.name
  else if (node.tags.amenity) label = node.tags.amenity
  else if (node.tags.highway) label = node.tags.highway

  var pos = nodeToTermCoords(camera, node)
  var x = pos[0]
  var y = pos[1]
  if (x < 0 || y < 0 || x >= termsize.width || y >= termsize.height) return

  charm.foreground(color(node))
  charm.position(x, y)
  charm.write('o')
  if (label) {
    charm.position(x - label.length/2, y - 1)
    charm.write(label)
  // } else {
  //   console.log(node.tags)
  }
}

function renderWay (charm, camera, allElements, way) {
  if (!way.tags) return
  if (way.tags.area === 'yes') return  // for now

  charm.display('bright')
  var chr = null
  var col = null
  var area = false
  charm.foreground('white')
  if (way.tags.highway) {
    var hw = way.tags.highway
    if (hw === 'track') {
      if (way.tags.tracktype === 'grade1') { col = 'white'; chr = '&' }
      else if (way.tags.tracktype === 'grade2') { col = 'white'; chr = '%' }
      else if (way.tags.tracktype === 'grade3') { col = 'white'; chr = '*' }
      else if (way.tags.tracktype === 'grade4') { col = 'white'; chr = '.' }
    }
    else if (hw === 'residential')    { col = 'black'; chr = '.' }
    else if (hw === 'living_street')  { col = 'black'; chr = '.' }
    else if (hw === 'service')        { col = 'cyan'; chr = '.' }
    else { col = 'white'; chr = '.' }
  }
  if (way.tags.barrier)               { col = 'black'; chr = 'x' }
  if (way.tags.leisure)               { col = 'green'; chr = '.'; area = true }
  if (way.tags.building)              { col = 'black'; chr = '#'; area = true }
  if (way.tags.landuse === 'orchard') { col = 'green'; chr = '^'; area = true }
  if (!col) { col = color(way); chr = '?' }
  charm.foreground(col)

  if (area) {
    // draw as polygon
  } else {
    // draw as line
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
        charm.write(chr)
      }
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
