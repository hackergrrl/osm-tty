var fs = require('fs')
var mkdirp = require('mkdirp')
var hyperdb = require('hyperdb')
var hyperosm = require('hyperdb-osm')
var grid = require('grid-point-store')
var level = require('level')
var sublevel = require('subleveldown')
var randomBytes = require('randombytes')
var path = require('path')
var osm2obj = require('osm2obj')

module.exports = function (dbdir, xmlname) {
  mkdirp.sync(dbdir)

  var ldb = level(path.join(dbdir, 'level'))
  var osm = hyperosm({
    db: hyperdb(path.join(dbdir, 'hyper'), { valueEncoding: 'json' }),
    index: ldb,
    pointstore: grid({ store: sublevel(ldb, 'geo'), zoomLevel: 8 })
  })

  var elms = []
  var oldToNewId = {}
  var byType = { node: 0, way: 0, relation: 0, bounds: 0 }

  fs.createReadStream(xmlname)
    .pipe(osm2obj())
    .on('data', function (elm) {
      delete elm.version
      var id = genId()
      oldToNewId[elm.id] = id
      elm.id = id

      if (elm.type === 'way') {
        elm.refs = (elms.refs||elm.nodes||[]).map(function (refId) {
          return oldToNewId[refId]
        }).filter(Boolean)
        delete elm.nodes
      }

      byType[elm.type]++

      elms.push(elm)
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
        console.log('success! imported', byType)
      })
    })

  function genId () {
    return randomBytes(8).toString('hex')
  }
}
