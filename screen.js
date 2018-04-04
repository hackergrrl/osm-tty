module.exports = Screen

function Screen (width, height) {
  if (!(this instanceof Screen)) return new Screen(width, height)

  this.lines = new Array(height)
  for (var i=0; i < height; i++) {
    this.lines[i] = (new Array(width)).fill(' ').join('')
  }

  this.x = 0
  this.y = 0
  this.width = width
  this.height = height
}

Screen.prototype.display = function (attr) {
  // TODO: add ascii support to ansi-diff-stream
  return
  var c = {
    reset : 0,
    bright : 1,
    dim : 2,
    underscore : 4,
    blink : 5,
    reverse : 7,
    hidden : 8
  }[attr];
  if (c === undefined) {
      throw new Error('Unknown attribute: ' + attr)
  }
  this.write(encode('[' + c + 'm'));
}

Screen.prototype.foreground = function (color) {
  // TODO: add ascii support to ansi-diff-stream
  return
  var c = {
    black   : 30,
    red     : 31,
    green   : 32,
    yellow  : 33,
    blue    : 34,
    magenta : 35,
    cyan    : 36,
    white   : 37
  }[color.toLowerCase()];

  if (!c) throw new Error('Unknown color: ' + color)
  this.write(encode('[' + c + 'm'))
}

Screen.prototype.position = function (x, y) {
  this.x = Math.min(this.width - 1, Math.max(0, x))
  this.y = Math.min(this.height - 1, Math.max(0, y))
}

Screen.prototype.write = function (txt) {
  if (this.y < 0 || this.y >= this.height) return
  if (this.x < 0) return
  if (this.x + txt.length >= this.width) return

  // if (this.x + txt.length >= this.width) {
  //   txt = txt.slice(0, this.width - (this.x + txt.length))
  // }

  var line = this.lines[this.y]
  this.lines[this.y] = line.slice(0, this.x) + txt + line.slice(this.x + txt.length)
}

Screen.prototype.data = function () {
  if (this.lines.length !== require('window-size').height) throw 'ack'
  this.lines.forEach(function (line) {
    if (line.length !== require('window-size').width) throw 'ack'
  })
  return this.lines.join('\n')
}

// from node-charm
function encode (xs) {
    function bytes (s) {
        if (typeof s === 'string') {
            return s.split('').map(ord);
        }
        else if (Array.isArray(s)) {
            return s.reduce(function (acc, c) {
                return acc.concat(bytes(c));
            }, []);
        }
    }
    return new Buffer([ 0x1b ].concat(bytes(xs)));
};

function ord (c) {
    return c.charCodeAt(0)
};
