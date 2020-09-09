const express = require('express')
const path = require('path')
const util = require('util')
const fs = require('fs')
const http = require('http')
const cors = require('cors')
const faker = require('faker')
const jsYaml = require('js-yaml')
const swaggerUi = require('swagger-ui-express')
const passport = require('./middleware/passport')
const api = require('./routes/api')
require('dotenv').config()
require('./model')

const asyncReadFile = util.promisify(fs.readFile)

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(passport.initialize())
app.use(passport.session())
app.use(cors())
app.use('/', express.static(path.join(__dirname)))
app.use('/', swaggerUi.serve)

app.use('/api', api)

app.get('/api-docs', async (req, res) => res.json(jsYaml.safeLoad(await asyncReadFile('./swagger/openapi.yaml', 'utf8'))))
app.get('/api-docs/example', async (req, res) => res.json(jsYaml.safeLoad(await asyncReadFile('./swagger/example.yaml', 'utf8'))))
app.get('/api-docs/link', async (req, res) => res.json(jsYaml.safeLoad(await asyncReadFile('./swagger/link.yaml', 'utf8'))))
app.get('/api-docs/petstore', async (req, res) => res.json(jsYaml.safeLoad(await asyncReadFile('./swagger/petstore.yaml', 'utf8'))))

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
