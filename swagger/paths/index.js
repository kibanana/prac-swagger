const util = require('util')
const fs = require('fs')
const asyncReadFile = util.promisify(fs.readFile)
const asyncWriteFile = util.promisify(fs.writeFile)

module.exports = async () => {
  let paths = ''
  const filePathArr = ['auth', 'board', 'file', 'font', 'user']
  for (let i = 0; i < filePathArr.length; i++) {
    try {
      paths += await asyncReadFile(`./swagger/paths/${filePathArr[i]}.yaml`, 'utf8')
    }
    catch (err) {
      console.log(err)
    }
  }
  await asyncWriteFile('./swagger/paths/index.yaml', paths)
}
