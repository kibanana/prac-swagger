const express = require('express')
const passport = require('./middleware/passport')
const api = require('./routes/api')

const path = require('path')
const cors = require('cors')
const http = require('http')
const faker = require('faker')

const util = require('util')
const fs = require('fs')
const asyncReadFile = util.promisify(fs.readFile)
const jsYaml = require('js-yaml')
const swaggerUi = require('swagger-ui-express')
const swaggerPathsCreator = require('./swagger/paths')

require('dotenv').config()
require('./model')

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(passport.initialize())
app.use(passport.session())
app.use(cors())

app.use('/api', api)
app.use('/v1', api)

app.use('/', express.static(path.join(__dirname)))
app.use('/', swaggerUi.serve)
app.get('/api-docs',
async (req, res, next) => {
  asyncReadFile('./swagger/openapi.yaml', 'utf8')
    .then((swaggerConfigYaml) => {
      // 여기서 value로 처리하니까 계속 문제가 생김 (두 번으로 중복되는 yaml 값이 들어감)
      // req.config = swaggerConfigYaml
      req.config = jsYaml.safeLoad(swaggerConfigYaml)
      next()
    })
    .catch(err => console.log(err))
}, (req, res, next) => {
  // swaggerUi.setup(req.config)
  res.json(req.config)
})

app.get('/example',
async (req, res, next) => {
  asyncReadFile('./swagger/example.yaml', 'utf8')
    .then((swaggerConfigYaml) => {
      // 여기서 value로 처리하니까 계속 문제가 생김 (두 번으로 중복되는 yaml 값이 들어감)
      // req.config = swaggerConfigYaml
      req.config = jsYaml.safeLoad(swaggerConfigYaml)
      next()
    })
    .catch(err => console.log(err))
}, (req, res, next) => {
  // swaggerUi.setup(req.config)
  res.json(req.config)
})

app.get('/link',
async (req, res, next) => {
  asyncReadFile('./swagger/link.yaml', 'utf8')
    .then((swaggerConfigYaml) => {
      // 여기서 value로 처리하니까 계속 문제가 생김 (두 번으로 중복되는 yaml 값이 들어감)
      // req.config = swaggerConfigYaml
      req.config = jsYaml.safeLoad(swaggerConfigYaml)
      next()
    })
    .catch(err => console.log(err))
}, (req, res, next) => {
  // swaggerUi.setup(req.config)
  res.json(req.config)
})

app.get('/petstore',
async (req, res, next) => {
  asyncReadFile('./swagger/petstore.yaml', 'utf8')
    .then((swaggerConfigYaml) => {
      // 여기서 value로 처리하니까 계속 문제가 생김 (두 번으로 중복되는 yaml 값이 들어감)
      // req.config = swaggerConfigYaml
      req.config = jsYaml.safeLoad(swaggerConfigYaml)
      next()
    })
    .catch(err => console.log(err))
}, (req, res, next) => {
  // swaggerUi.setup(req.config)
  res.json(req.config)
})

const server = http.createServer(app)
const io = require('socket.io')(server)

io.on('connection', (socket) => {
  socket.nickname = faker.name.findName()
  socket.join('room')
  socket.broadcast.to('room').emit('add_user', {
    nickname: socket.nickname,
    message: `${socket.nickname}이(가) 채팅방에 참여합니다.`
  })
  socket.on('disconnect', () => {
    socket.broadcast.to('room').emit('remove_user', {
      nickname: socket.nickname,
      message: `${socket.nickname}이(가) 채팅방을 떠났습니다.`
    })
    socket.leaveAll()
  })
})

server.listen(3000, () => {
  console.log('Server is listening on port 3000!')
})
