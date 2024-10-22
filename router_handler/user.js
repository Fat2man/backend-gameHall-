const db = require('../db/index')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config/config')
const path = require('path')
exports.reguser = (req, res) => {
  const userinfo = req.body
  console.log(userinfo, 'userinfo');
  const sqlStr = 'select * from ev_users where username = ?'
  db.query(sqlStr, [userinfo.username], (err, results) => {
    if (err) {
      return res.cc(err)
    }
    if (results.length > 0) {
      return res.cc('用户名被占用，请更换其他用户名！')
    }
  })
  userinfo.password = bcrypt.hashSync(userinfo.password, 10)
  const sql = 'insert into ev_users set ?'
  db.query(sql, { username: userinfo.username, password: userinfo.password, user_pic: userinfo.avatar }, (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows !== 1) {
      return res.cc('注册用户失败，请稍后再试')
    }
    res.send({
      status: 0,
      message: '注册成功！'
    })
  })
}
exports.login = (req, res) => {
  const userinfo = req.body
  const sqlStr = 'select * from ev_users where username = ?'
  db.query(sqlStr, userinfo.username, (err, results) => {
    if (err) return res.cc(err)
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
  })
}
exports.uploadPicture = (req, res) => {
  res.send({
    status: 0,
    imgUrl: 'http://182.92.108.102:8000/' + req.file.path
  })
}