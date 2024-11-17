const express = require('express')
const { createServer } = require("http"); //从http模块中导入createServer方法。用于创建HTTP服务器。
const { Server } = require("socket.io");  //引入socket.io 的Server类，用于在Node.js环境中创建和管理WebSocket服务器
const app = express()
const cors = require('cors')
const joi = require('joi')
const userRouter = require('./router/user')
const userinfoRounter = require('./router/userinfo')
// const pokerRouter = require('./router/poker')
const expressJwt = require('express-jwt')//只要成功配置了express-jwt 中间件，就可以把解析出来的用户信息，挂载到req.user属性
const config = require('./config/config')
const { deal, getCardValue, playTurn, calculateScore } = require('./utils/poker');  //发牌
const { json } = require('express');
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use((req, res, next) => {
  res.cc = (err, status = 1) => {
    res.send({
      status,
      message: err instanceof Error ? err.message : err
    })
  }
  next()
})
app.use('/public', express.static('/'));
app.use('/uploads', express.static('uploads'));
app.use(expressJwt({ secret: config.jwtSecretKey }).unless({ path: [/^\/api/] }))
app.use('/api', userRouter)
app.use('/my', userinfoRounter)
// app.use('/poker', pokerRouter)
app.use((err, req, res, next) => {
  if (err instanceof joi.ValidationError) return res.cc(err)
  console.log(err, 'req.user11');
  if (err.name === 'UnauthorizedError') return res.cc('身份认证失败！请重新登录', 2)  //status 为2是token 失效
  res.cc(err)
})
const httpServer = createServer(app);  //使用app作为回调函数来创建一个新的HTTP服务器实例，并将其赋值给变量httpServer。
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
})  //使用httpServer实例（以及可选的配置选项）来创建一个新的socket.io服务器实例
const userList = {}  //连接websocket用户对象列表
const rooms = {} //房间列表
const playHistory = {}  //每个房间玩家出牌历史记录
let timer  // timer 倒计时变量  
io.on("connection", (socket) => { //为io实例添加处理事件
  console.log('新用户连接了');
  socket.on('send', data => {
    io.emit('news', data)
  })
  io.emit("create-join-Room", rooms)
  socket.on('username', data => {
    if (data) {
      userList[socket.id] = data
    }
    console.log(userList, 'userList');
    io.emit('usersList', userList)
    io.emit('news', { msg: `${data.username}加入了群聊`, username: 'systemMsg' })
  })
  socket.on('sendFile', data => {
    io.emit('news', data)
  })
  socket.on('creatRoom', (roomInfo) => {
    let { roomName } = roomInfo
    socket.roomName = roomName  //给每个socket挂载一个所属房间名称
    if (!rooms[roomName]) {
      rooms[roomName] = {}
      rooms[roomName][socket.id] = { ...roomInfo, Homeowner: true };  //第一个建房的设置为房主  Homeowner true 房主  false  不是房主
      socket.join(roomName)
      io.emit("create-join-Room", rooms)  //触发新建/加入房间事件
    } else {
      const keys = Object.keys(rooms[roomName])
      if (roomInfo.roomPwd != rooms[roomName][keys[0]].roomPwd) {  //房间用户会携带房间密码信息，这里进行比较
        socket.emit("systemErr", '密码输入错误');
        return
      }
      rooms[roomName][socket.id] = { ...roomInfo, Homeowner: false };
      socket.join(roomName)
      io.emit("create-join-Room", rooms)  //触发新建/加入房间事件
    }
    socket.emit('enterRoom', rooms[roomName])
  })
  socket.on('getRoomUser', () => {  //获取房间成员信息
    io.emit('roomUser', rooms[socket.roomName])
    console.log(rooms, 'rooms[socket.roomName]')
  })
  socket.on('leaveRoom', () => {
    //离开房间
    if (timer) clearInterval(timer)
    if (rooms[socket.roomName] && Object.keys(rooms[socket.roomName]).length) {
      delete rooms[socket.roomName][socket.id]
      if (rooms[socket.roomName] && !Object.keys(rooms[socket.roomName]).length) {
        delete rooms[socket.roomName]
      }
      io.emit("roomUser", rooms[socket.roomName]) //向用户端更新最新房间数据
    }
  })
  socket.on('goReady', (ready) => {
    rooms[socket.roomName][socket.id].ready = ready
    io.emit('roomUser', rooms[socket.roomName])
  })
  function countTime(keysList) {  /* timeList：倒计时数组  userSet  房间用户对象*/
    if (timer) clearInterval(timer)  //如果存在倒计时变量，先清除再重新计时
    let i = 0, key = keysList[i]
    let gameRoom = rooms[socket.roomName]
    timer = setInterval(() => {
      if (gameRoom[key].countdown > 0) {
        --gameRoom[key].countdown
        io.to(socket.roomName).emit('landLord', gameRoom)  //倒计时
      } else {
        i = ++i % 3
        key = keysList[i]
        gameRoom[key].countdown = 20
        io.to(socket.roomName).emit('landLord', gameRoom)
      }
    }, 1000)
  }
  function startGame() {  //发牌＋计时
    let pokerList = deal()
    let gameRoom = rooms[socket.roomName]
    let keysList = Object.keys(gameRoom)
    for (let i = 0; i < keysList.length; i++) {   //给房间三个人发牌
      let key = keysList[i]
      gameRoom[key].poker = pokerList[`player${i + 1}`]  //每个玩家的手牌
      if (i == 0) {
        gameRoom[key].countdown = 20  //从第一个人开始计时，默认20s 
      } else {
        gameRoom[key].countdown = 0
      }
    }
    io.to(socket.roomName).emit('hasDizhu', false); //刚开始游戏没有地主
    io.to(socket.roomName).emit('audio', 'start')
    io.to(socket.roomName).emit('poker', gameRoom, pokerList.lord);
    playHistory[socket.roomName] = []  //置房间出牌记录为空，记录出牌历史
    countTime(keysList)  //调用倒计时函数
  }
  socket.on('goStart', () => {  //开始游戏
    startGame()
  })
  socket.on('callLandlord', (obj) => { //监听叫地主事件
    //根据情况播放抢地主音效
    const { e, lordSet, hasCall } = obj
    if (e === -1) {
      io.to(socket.roomName).emit('audio', 'nocall1')
    } else if (hasCall) {
      let str
      hasCall === 1
        ? str = 'rob0'
        : str = 'rob1'
      io.to(socket.roomName).emit('audio', str)
    } else if (e === 1) {
      io.to(socket.roomName).emit('audio', 'call')
    }
    let gameRoom = rooms[socket.roomName]
    let call = gameRoom[socket.id].call ?? 0
    call += e
    gameRoom[socket.id].call = call
    if (call === 2) {
      gameRoom[socket.id].countdown = 20
      gameRoom[socket.id].landlord = true   //地主
      gameRoom[socket.id].poker = gameRoom[socket.id].poker.concat(lordSet).sort((a, b) => getCardValue(b) - getCardValue(a))  //取走底牌，并再次排序
      io.to(socket.roomName).emit('hasDizhu', true);
      io.to(socket.roomName).emit('landLord', gameRoom)  //回传给客户端
      playHistory[socket.roomName] = []  //置房间出牌记录为空，记录出牌历史
      return
    }
    let countM1 = 0, countP1 = 0 //记录有几个-1几个1，如果有两个-1，一个1，就是两个人没叫地主，另一个叫地主；三个-1就是没人叫地主；
    for (let i in gameRoom) {
      if (gameRoom[i].call === -1) countM1 += 1
      if (gameRoom[i].call === 1) countP1 += 1
    }
    if (countM1 === 2 && countP1 === 1) { //产生了地主
      for (let i in gameRoom) {
        if (gameRoom[i].call === 1) {
          gameRoom[i].poker = gameRoom[i].poker.concat(lordSet).sort((a, b) => getCardValue(b) - getCardValue(a)) //取走底牌，并再次排序
          gameRoom[i].landlord = true
          gameRoom[i].countdown = 20
        } else {
          gameRoom[i].countdown = 0
        }
      }
      io.to(socket.roomName).emit('hasDizhu', true);
      io.to(socket.roomName).emit('landLord', gameRoom)  //回传给客户端
      playHistory[socket.roomName] = []  //置房间出牌记录为空，记录出牌历史
      return
    } else if (countM1 === 3) {  //没人叫地主，重新发牌
      for (let i in gameRoom) {
        gameRoom[i].call = undefined
      }
      startGame()
    }
    gameRoom[socket.id].countdown = 0
    io.to(socket.roomName).emit('landLord', gameRoom)  //回传给客户端
  })
  socket.on("playPoker", (obj) => {  //出牌
    let gameRoom = rooms[socket.roomName]
    const { flag, type } = playTurn(gameRoom[socket.id].userName, obj, playHistory[socket.roomName])
    console.log("🚀 ~ socket.on ~ type:", type)
    console.log("🚀 ~ socket.on ~ flag:", flag)
    if (flag) {
      gameRoom[socket.id].poker = gameRoom[socket.id].poker.filter(item => !obj.includes(item))
      gameRoom[socket.id].countdown = 0
      gameRoom[socket.id].lastPoker = obj
      console.log("🚀 ~ socket.on ~ gameRoom[socket.id].lastPoker:", gameRoom[socket.id].lastPoker)
      playHistory[socket.roomName].push({ id: gameRoom[socket.id].userName, obj })  //出牌历史记录里面添加当前出牌组合
      io.to(socket.roomName).emit('audio', 'play')
      io.to(socket.roomName).emit('audio', type)
      io.to(socket.roomName).emit("playToClient", gameRoom)
    }
  })
  socket.on("passPoker", () => {  //过
    rooms[socket.roomName][socket.id].lastPoker = []
    rooms[socket.roomName][socket.id].countdown = 0
    playHistory[socket.roomName].push({ id: rooms[socket.roomName][socket.id].userName, obj: [] })   //出牌历史记录里面添加当前玩家，出牌设为空数组
    io.to(socket.roomName).emit('audio', 'pass')
    io.to(socket.roomName).emit("playToClient", rooms[socket.roomName])
  })
  socket.on("overToServer", async ({ winner, score, losers }) => {  //游戏结束
    console.log("🚀 ~ socket.on ~ winner, score,losers:", winner, score, losers)
    clearInterval(timer)   //停止计时
    try {
      const result = await calculateScore(winner, score, losers)
      io.to(socket.roomName).emit('audio', 'win')
      for (let key in rooms[socket.roomName]) {
        let player = rooms[socket.roomName][key]
        player.baseScore = 15
        player.multiplier = 480
        result.map(item => {
          if (item.username === player.userName) player.score = item.score
        })
        if (player.userName === winner) {   //记录连胜情况
          player.winStreak ? player.winStreak += 1 : player.winStreak = 1
          player.landlord ? player.settleScore = '+1000' : player.settleScore = '+500'
        } else {
          player.winStreak = 0
          player.landlord ? player.settleScore = '-1000' : player.settleScore = '-500'
        }
      }
      io.to(socket.roomName).emit('overToClient', winner, rooms[socket.roomName])
      console.log("🚀 ~ socket.on ~ result:", result)
    } catch (error) {
      console.log("🚀 ~ socket.on ~ error:", error)
    }
    console.log("🚀 ~ socket.on ~ rooms[socket.roomName]:", rooms[socket.roomName])
  })
  socket.on("continueGame", () => {
    rooms[socket.roomName][socket.id].poker = []  //清空玩家手牌
    rooms[socket.roomName][socket.id].ready = null
    rooms[socket.roomName][socket.id].lastPoker = null
    rooms[socket.roomName][socket.id].landlord = null
    playHistory[socket.roomName] = [] //置房间出牌记录为空
    io.to(socket.roomName).emit('roomUser', rooms[socket.roomName]);
  })
  // 监听断开事件
  socket.on('disconnect', (reason) => {
    //聊天室用户退出，用户在线列表删除改用户信息】
    delete userList[socket.id]
    io.emit('usersList', userList)
    //斗地主离开房间
    if (timer) clearInterval(timer)
    if (rooms[socket.roomName] && Object.keys(rooms[socket.roomName]).length) {
      delete rooms[socket.roomName][socket.id]
      if (rooms[socket.roomName] && !Object.keys(rooms[socket.roomName]).length) {
        delete rooms[socket.roomName]
      }
      io.emit("roomUser", rooms[socket.roomName]) //向用户端更新最新房间数据
    }

  })
});

httpServer.listen(8000, () => {
  console.log('api_server服务已经启动 http://8.140.238.198:8000')
})
