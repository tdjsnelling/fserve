const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
const handlebars = require('express-handlebars')
const mime = require('mime-types')
const filesize = require('filesize')

app.set('views', './templates')
app.engine('handlebars', handlebars())
app.set('view engine', 'handlebars')

if (process.argv.length <= 2) {
  console.log(`usage: ${__filename} path/to/directory`)
  process.exit(-1)
}

const userPath = fs.realpathSync(process.argv[2])

app.use('/file', express.static(userPath))
app.use('/static', express.static('static'))

const delimeter = '>'

const getDirectory = (directory, cb) => {
  const fullDir = []
  const dir = fs.realpathSync(directory)
  const items = fs.readdirSync(dir)

  for (i in items) {
    const absPath = path.join(dir, items[i])
    const stats = fs.statSync(absPath)
    const type = mime.lookup(absPath)
    const entry = {
      parent: dir,
      name: items[i],
      path: absPath,
      size: filesize(stats.size),
      type: type,
      isDir: stats.isDirectory(),
      isImage: type && type.indexOf('image/') !== -1,
      relPath: dir.replace(userPath, '') + '/' + items[i],
      formattedRelPath: dir.replace(userPath, '').replace(new RegExp('/', 'g'), delimeter) + delimeter + items[i]
    }
    fullDir.push(entry)
  }
  return fullDir
}

app.get('/', (req, res) => {
  res.render('index', {
    files: getDirectory(userPath)
  })
})

app.get('/:path', (req, res) => {
  const parsedPath = req.params.path.replace(new RegExp(delimeter, 'g'), '/')
  res.render('index', {
    files: getDirectory(path.join(userPath, parsedPath))
  })
})

app.listen(9000)
