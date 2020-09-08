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

require('dotenv').config()
require('./model')

const swaggerSpec = asyncReadFile('./swagger/openapi.yaml', 'utf8')
  .then(swaggerConfigYaml => jsYaml.safeLoad(swaggerConfigYaml))
  .catch(err => console.log(err))

const swaggerSpecTest = asyncReadFile('./swagger/main.yaml', 'utf8')
  .then(swaggerConfigYaml => jsYaml.safeLoad(swaggerConfigYaml))
  .catch(err => console.log(err))

const swaggerSpecExample = asyncReadFile('./swagger/example.yaml', 'utf8')
  .then(swaggerConfigYaml => jsYaml.safeLoad(swaggerConfigYaml))
  .catch(err => console.log(err))

const swaggerSpecLink = asyncReadFile('./swagger/link.yaml', 'utf8')
  .then(swaggerConfigYaml => jsYaml.safeLoad(swaggerConfigYaml))
  .catch(err => console.log(err))

const swaggerSpecPetStore = asyncReadFile('./swagger/petstore.yaml', 'utf8')
  .then(swaggerConfigYaml => jsYaml.safeLoad(swaggerConfigYaml))
  .catch(err => console.log(err))

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(passport.initialize())
app.use(passport.session())
app.use(cors())

app.use('/api', api)
app.use('/v1', api)

app.use('/', express.static(path.join(__dirname)))

app.use('/api-docs', swaggerUi.serve)
app.get('/api-docs/main', swaggerUi.serve, async (req, res) => res.json(await swaggerSpec))
app.get('/api-docs/test', swaggerUi.serve, async (req, res) => res.json(await swaggerSpecTest))
app.get('/api-docs/example', swaggerUi.serve, async (req, res) => res.json(await swaggerSpecExample))
app.get('/api-docs/link', swaggerUi.serve, async (req, res) => res.json(await swaggerSpecLink))
app.get('/api-docs/petstore', swaggerUi.serve, async (req, res) => res.json(await swaggerSpecPetStore))

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
