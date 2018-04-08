#/usr/bin/env node

var fs = require('fs')
var argv = require('minimist')(process.argv)

function usage () {
  console.error('USAGE: osm-tty DB <LAT LON>')
  console.error('USAGE: osm-tty import DB file.xml')
  process.exit(1)
}

if (argv._[2] === 'import') {
  if (argv._.length !== 5) usage()

  var importer = require('./import')
  importer(argv._[3], argv._[4])
} else {
  if (argv._.length < 3) usage()

  var dbdir = argv._[2]
  var at = [-154.973145, 19.585022]
  if (argv._[3] && argv._[4]) {
    at = [Number(argv._[4]), Number(argv._[3])]
  }
  var size = 0.0005

  var client = require('./index')
  client(dbdir, at, size)
}
