const config = require('config');
const rp = require('request-promise');
const _ = require('lodash')
const async = require('async');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const PushNotifyManager = require('./lib/job/pushNotify');
const CONSTANTS = require('./lib/const');
const bodyParser = require('body-parser')
const redisConnections = require('./lib/connections/redis');
var cors = require('cors')

const mapUserToSocket = {};

app.use(bodyParser.json());
app.use(cors())

app.get('/', function (req, res) {
  res.send("Hello world!")
});

app.post('/api/v1.0/emit/user', (req, res) => {
  const userId = req.body.userId;
  const eventName = req.body.eventName;
  const data = req.body.data;

  const socketInstance = mapUserToSocket[userId];

  if(socketInstance) {
    socketInstance.emit(eventName, data);
    return res.json({
      code: CONSTANTS.CODE.SUCCESS
    });
  }

  return res.json({
    code: CONSTANTS.CODE.FAIL
  })
});

io.on('connection', function (socket) {
  console.log('socket:connected',mapUserToSocket);
  socket.on('login', (data, cb) => {
    (typeof cb !== "function") && (cb = function() {});
    redisConnections('master').getConnection().get(`user:${data.token}`, (err, result) => {
        if(err || !result) {
          return cb({
            code: 300
          })
        }

        const userId = JSON.parse(result).id;
        socket.userId = userId;
        mapUserToSocket[userId] = socket;
        cb({
          code: 200
        })
      })
  })

  socket.on('disconnect', (reason) => {
    if(socket.userId) {
      delete mapUserToSocket[socket.userId];
    }
  })
})

server.listen(config.port, () => {
  console.log('Server listening at port:', config.port)
});
