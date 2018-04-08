var termsize = require('window-size')
var bresenham = require('bresenham')
var flood = require('flood-fill')
var zeros = require('zeros')

module.exports = drawFilledPolygon

function drawFilledPolygon (screen, pts, chr) {
  // get bounds
  var minX, minY, maxX, maxY
  for (var i = 0; i < pts.length + 1; i++) {
    var p = pts[i]
    if (!p) continue
    if (!minX || p[0] < minX) minX = p[0]
    if (!maxX || p[0] > maxX) maxX = p[0]
    if (!minY || p[1] < minY) minY = p[1]
    if (!maxY || p[1] > maxY) maxY = p[1]
  }

  // draw a point if the poly is very small
  if (maxX - minX <= 2 && maxY - minY <= 2) {
    screen.position(minX, minY)
    screen.write(chr)
    return
  }

  // create virtual canvas
  var xoffset = -minX + 2
  var yoffset = -minY + 2
  var canvas = zeros([maxX - minX + 4, maxY - minY + 4])

  // draw lines
  for (var i=0; i < pts.length; i++) {
    var j = (i + 1) % pts.length
    var linepts = bresenham(pts[i][0], pts[i][1], pts[j][0], pts[j][1])
    for (var j=0; j < linepts.length; j++) {
      var x = linepts[j].x
      var y = linepts[j].y
      canvas.set(x + xoffset, y + yoffset, 1)
    }
  }

  // floodfill at 0,0
  flood(canvas, 0, 0, 2)

  // iterate canvas; draw all points not '2's
  for (var i=0; i < canvas.shape[0]; i++) {
    for (var j=0; j < canvas.shape[1]; j++) {
      var x = i - xoffset
      var y = j - yoffset
      if (canvas.get(i, j) !== 2 && visible(x, y)) {
        screen.position(x, y)
        screen.write(chr)
      }
    }
  }
}

function visible (x, y) {
  return x >= 0 && y >= 0 && y < termsize.height && x < termsize.width
}
