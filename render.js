module.exports = render

var bresenham = require('bresenham')
var termsize = require('window-size')
var polygon = require('./polygon')
// var vscreen = require('./screen')

function render (charm, state, elements, allElements) {
  state.labels = []
  // var screen = vscreen(termsize.width, termsize.height)
  elements.forEach(renderElement.bind(null, charm, state, allElements))
  drawLabels(charm, state)
  drawStatusBar(charm, state)
  // return screen.data()
}

function renderElement (screen, state, allElements, element) {
  switch (element.type) {
    case 'node': renderNode(screen, state, allElements, element); break
    case 'way': renderWay(screen, state, allElements, element); break
    // default: console.log('unknown', element.type)
  }
}

function nodeToTermCoords (camera, node) {
  var horizScale = 1//0.55
  var vertScale = 1

  var w = camera.bbox[1][1] - camera.bbox[1][0]
  var h = camera.bbox[0][1] - camera.bbox[0][0]
  var x = Math.round(((node.lon - camera.bbox[1][0]) / w) * termsize.width * horizScale)
  var y = termsize.height - Math.round(((node.lat - camera.bbox[0][0]) / h) * termsize.height * vertScale)
  return [x, y]
}

function renderNode (screen, state, allElements, node) {
  if (!node.tags) return

  if (node.tags.noexit) return

  var label = getName(node)
  if (state.hints) {
    var hint = genHint(state.hints)
    state.hints[hint] = node.id
    label = hint
  }

  var pos = nodeToTermCoords(state.camera, node)
  var x = pos[0]
  var y = pos[1]
  if (x < 0 || y < 0 || x >= termsize.width || y >= termsize.height) return

  screen.position(x, y)
  screen.foreground(color(node))
  screen.write('o')
  if (label) {
    var lx = x - label.length / 2
    var ly = y - 1
    if (lx < 0) lx = 0
    addLabel(screen, state, lx, ly, color(node), label)
  }
}

function renderWay (screen, state, allElements, way) {
  if (!way.tags) return
  if (way.tags.area === 'yes') return  // for now

  screen.display('bright')
  var chr = null
  var col = null
  var area = false
  if (way.tags.highway) {
    var hw = way.tags.highway
    if (hw === 'track') {
      if (way.tags.tracktype === 'grade4') { col = 'white'; chr = '&' }
      else if (way.tags.tracktype === 'grade3') { col = 'white'; chr = '%' }
      else if (way.tags.tracktype === 'grade2') { col = 'white'; chr = '*' }
      else if (way.tags.tracktype === 'grade1') { col = 'white'; chr = '.' }
      else                                      { col = 'white'; chr = '*' }
    }
    else if (hw === 'residential')    { col = 'black'; chr = '.' }
    else if (hw === 'living_street')  { col = 'black'; chr = '.' }
    else if (hw === 'service')        { col = 'cyan'; chr = '.' }
    else { col = 'white'; chr = '.' }
  }
  if (way.tags.barrier)                    { col = 'black'; chr = 'x' }
  if (way.tags.leisure)                    { col = 'green'; chr = '.'; area = true }
  if (way.tags.building)                   { col = 'black'; chr = '#'; area = true }
  if (way.tags.landuse === 'orchard')      { col = 'green'; chr = '^'; area = true }
  else if (way.tags.landuse === 'retail')       { col = 'black'; chr = '$'; area = true }
  else if (way.tags.landuse === 'residential')  { col = 'green'; chr = '.'; area = true }
  else if (way.tags.landuse === 'residential')  { col = 'green'; chr = '.'; area = true }
  else if (way.tags.landuse)                    { col = 'green'; chr = '^'; area = true }
  if (way.tags.amenity === 'university')        { col = 'magenta'; chr = '.'; area = true }
  else if (way.tags.amenity === 'parking')      { col = 'black'; chr = '-'; area = true }
  else if (way.tags.amenity === 'cinema')       { col = 'yellow'; chr = '!'; area = true }
  else if (way.tags.amenity)               { chr = '?'; area = true }
  if (way.tags.natural)                    { col = 'green'; chr = '~' }
  if (way.tags.water)                      { col = 'blue'; chr = '~' }
  if (way.tags.waterway)                   { col = 'blue'; chr = '~' }
  if (way.tags.power)                      { col = 'yellow'; chr = 'z' }
  if (way.tags.railway)                    { col = 'darkyellow'; chr = 'x' }
  if (!col) { col = color(way); chr = '?' }

  if (col.startsWith('dark')) { screen.display('dim'); col = col.replace('dark', '') }
  else { screen.display('bright'); screen.display('bright') }
  screen.foreground(col)

  var label = getName(way)
  if (state.hints) {
    var hint = genHint(state.hints)
    state.hints[hint] = way.id
    label = hint
  }

  if (area) {
    // draw as polygon
    var centroid = [0,0]
    var pts = []
    for (var i=0; i < way.refs.length; i++) {
      var n = allElements[way.refs[i]]
      if (!n) continue
      var p = nodeToTermCoords(state.camera, n)
      pts.push(p)
      centroid[0] += p[0]
      centroid[1] += p[1]
    }
    polygon(screen, pts, chr)

    if (label) {
      centroid[0] /= way.refs.length
      centroid[1] /= way.refs.length
      addLabel(screen, state, centroid[0] - label.length/3, centroid[1], 'white', label)
    }
  } else {
    // draw as line
    var lx, ly

    for (var i=0; i < way.refs.length - 1; i++) {
      var n1 = allElements[way.refs[i]]
      var n2 = allElements[way.refs[i+1]]
      if (!n1 || !n2) continue
      var p1 = nodeToTermCoords(state.camera, n1)
      var p2 = nodeToTermCoords(state.camera, n2)
      var pts = bresenham(p1[0], p1[1], p2[0], p2[1])
      for (var j=0; j < pts.length; j++) {
        var x = pts[j].x
        var y = pts[j].y
        if (x < 0 || y < 0 || x >= termsize.width || y >= termsize.height) continue
        if (x > 15 && x < termsize.width - 15 && y > 3 && y <= termsize.height - 3) {
          if (!lx && !ly) {
            lx = x
            ly = y
          }
        }
        screen.position(x, y)
        screen.write(chr)
      }
    }

    if (lx && ly && label) {
      addLabel(screen, state, lx, ly, 'white', label)
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

function drawStatusBar (screen, state) {
  screen.foreground('white')

  screen.position(0, termsize.height - 1)
  for (var i = 0; i < termsize.width; i++) {
    screen.write('=')
  }
  screen.position(0, termsize.height - 0)
  for (var i = 0; i < termsize.width; i++) {
    screen.write(' ')
  }

  screen.position(termsize.width - 25, termsize.height - 0)
  var lat = ((state.camera.bbox[0][1] + state.camera.bbox[0][0]) / 2).toFixed(6)
  var lon = ((state.camera.bbox[1][1] + state.camera.bbox[1][0]) / 2).toFixed(6)
  screen.write(lat + ' ' + lon)

  if (state.mode) {
    screen.position(2, termsize.height - 0)
    screen.write('-- ' + state.mode.toUpperCase() + ' --')
  }
}

function getName (elm) {
  var label
  if (elm.tags.name) label = elm.tags.name
  else if (elm.tags.amenity) label = elm.tags.amenity
  else elm.tags.toString()
  return label
}

function addLabel (screen, state, x, y, col, label) {
  if (y < 0 || y >= termsize.height) return
  if (x < 0) return
  if (x + label.length >= termsize.width) label = label.substring(0, label.length - x)

  state.labels.push({
    x: x,
    y: y,
    label: label,
    color: col
  })
}

function drawLabels (screen, state) {
  if (state.hints) screen.display('underscore')
  state.labels.forEach(function (label) {
    screen.foreground(label.color)
    screen.position(label.x, label.y)
    screen.write(label.label)
  })
  if (state.hints) screen.display('reset')
}

var hintchars = [ 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
                  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=' ]
function genHint (hints) {
  return hintchars[Object.keys(hints).length % hintchars.length]

  var s = ''
  var n = Object.keys(hints).length
  while (n >= 0) {
    s += hintchars[n % hintchars.length]
    n -= hintchars.length
  }
  return s
}
