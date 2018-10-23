const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()

if (process.argv.length <= 2) {
  console.log(`usage: ${__filename} path/to/directory`)
  process.exit(-1)
}

const userPath = process.argv[2]

const getDirectory = (directory, cb) => {
  const fullDir = []
  const dir = fs.realpathSync(directory)
  const items = fs.readdirSync(dir)

  for (i in items) {
    const entry = {}
    const absPath = path.join(dir, items[i])
    const stats = fs.statSync(absPath)

    entry.path = absPath
    entry.size = stats.size
    entry.isDir = stats.isDirectory()

    fullDir.push(entry)
  }
  return fullDir
}

app.get('/', (req, res) => {
  res.send(getDirectory(userPath))
})

app.listen(9000)
