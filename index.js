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

const sortAlpha = (a, b) => {
  const nameA = a.name.toLowerCase()
  const nameB = b.name.toLowerCase()

  if (nameA < nameB) {
    return -1
  }
  else if (nameA > nameB) {
    return 1
  }

  return 0
}

const sortExtension = (a, b) => {
  const nameA = a.name.toLowerCase().split('.')
  const nameB = b.name.toLowerCase().split('.')

  const extA = nameA[nameA.length - 1]
  const extB = nameB[nameB.length - 1]

  if (extA < extB) {
    return -1
  }
  else if (extA > extB) {
    return 1
  }

  return 0
}

const getDirectory = (directory, sortingByType, reverse) => {
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

  let sortedDir

  if (sortingByType) {
    const directories = fullDir.filter(x => x.isDir).sort(sortAlpha)
    const dotfiles = fullDir.filter(x => !x.isDir && x.name[0] === '.').sort(sortAlpha)
    const other = fullDir.filter(x => !x.isDir && x.name[0] !== '.').sort(sortExtension)

    sortedDir = directories.concat(dotfiles).concat(other)
  }
  else {
    sortedDir = fullDir.sort(sortAlpha)
  }

  if (reverse) return sortedDir.reverse()
  return sortedDir
}

app.get('/', (req, res) => {
  res.render('index', {
    files: getDirectory(userPath, false, false)
  })
})

app.get('/:path', (req, res) => {
  const parsedPath = req.params.path.replace(new RegExp(delimeter, 'g'), '/')
  res.render('index', {
    files: getDirectory(path.join(userPath, parsedPath), true)
  })
})

app.listen(9000)
