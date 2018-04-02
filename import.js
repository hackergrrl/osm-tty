var fs = require('fs')

if (!process.argv[2] || !process.argv[3] || !fs.existsSync(process.argv[3])) {
  console.error('USAGE: node import.js DB DATA.XML')
  process.exit(1)
}

var mkdirp = require('mkdirp')
var dbdir = process.argv[2]
mkdirp.sync(dbdir)

var hyperdb = require('hyperdb')
var hyperosm = require('hyperdb-osm')
var grid = require('grid-point-store')
var level = require('level')
var sublevel = require('subleveldown')

var randomBytes = require('random-bytes')
var path = require('path')
var osm2obj = require('osm2obj')

var ldb = level(path.join(dbdir, 'level'))
var osm = hyperosm({
  db: hyperdb(path.join(dbdir, 'hyper'), { valueEncoding: 'json' }),
  index: ldb,
  pointstore: grid({ store: sublevel(ldb, 'geo') })
})

var elms = []
var oldToNewId = {}

fs.createReadStream(process.argv[3])
  .pipe(osm2obj())
  .on('data', function (elm) {
    delete elm.version
    var id = genId()
    oldToNewId[elm.id] = id
    elm.id = id
    elms.push(elm)
    console.log('elm', elm)
  })
  .on('end', function () {
    var batch = elms.map(function (elm) {
      var id = elm.id
      delete elm.id
      return {
        type: 'put',
        id: id,
        value: elm
      }
    })
    osm.batch(batch, function (err, res) {
      if (err) throw err
      console.log('success! imported', res.length, 'elements')
    })
  })

function genId () {
  return randomBytes(8).toString('hex')
}
