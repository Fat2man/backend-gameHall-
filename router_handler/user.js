const db = require('../db/index')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config/config')
const path = require('path')
exports.reguser = async (req, res) => {
  const userinfo = req.body
  const sqlStr = 'select * from ev_users where username = ?'
  try {
    const [results1] = await db.query(sqlStr, [userinfo.username])
    if (results1.length > 0) {
      return res.cc('用户名被占用，请更换其他用户名！')
    }
    userinfo.password = bcrypt.hashSync(userinfo.password, 10)
    const sql = 'insert into ev_users set ?'
    const [results2] = await db.query(sql, { username: userinfo.username, password: userinfo.password, user_pic: userinfo.avatar })
    if (results2.affectedRows !== 1) {
      return res.cc('注册用户失败，请稍后再试')
    }
    res.send({
      status: 0,
      message: '注册成功！'
    })
  } catch (err) {
    res.cc(err)
  }
}
exports.login = async (req, res) => {
  const userinfo = req.body
  const sqlStr = 'select * from ev_users where username = ?'
  try {
    const [results] = await db.query(sqlStr, userinfo.username)
    if (results.length !== 1) return res.cc('账号或密码错误！')
    const compareResult = bcrypt.compareSync(userinfo.password, results[0].password)
    if (!compareResult) return res.cc('账号或密码错误！')
    const user = { ...results[0], password: '' }
    const token = jwt.sign(user, config.jwtSecretKey, { expiresIn: config.expiresIn })
    delete user.password
    res.send({
      status: 0,
      message: '登录成功',
      token: 'Bearer ' + token,
      userInfo: user
    })
  } catch (err) {
    res.cc(err)
  }
}
exports.uploadPicture = (req, res) => {
  res.send({
    status: 0,
    imgUrl: 'http://8.140.238.198:8000/' + req.file.path
  })
}