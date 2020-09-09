const express = require('express')
const swaggerUi = require('swagger-ui-express')
const path = require('path')
const cors = require('cors')
const http = require('http')
const faker = require('faker')
const fs = require('fs')
const jsYaml = require('js-yaml')
const passport = require('./middleware/passport')
const api = require('./routes/api')

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

app.use('/api-docs', swaggerUi.serve)
app.use('/api-docs/main', swaggerUi.setup(jsYaml.safeLoad(fs.readFileSync('./swagger/openapi.yaml', 'utf8'))))
app.use('/api-docs/test', swaggerUi.setup(jsYaml.safeLoad(fs.readFileSync('./swagger/test.yaml', 'utf8'))))
app.use('/api-docs/example', swaggerUi.setup(jsYaml.safeLoad(fs.readFileSync('./swagger/example.yaml', 'utf8'))))
app.use('/api-docs/link', swaggerUi.setup(jsYaml.safeLoad(fs.readFileSync('./swagger/link.yaml', 'utf8'))))
app.use('/api-docs/petstore', swaggerUi.setup(jsYaml.safeLoad(fs.readFileSync('./swagger/petstore.yaml', 'utf8'))))

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
