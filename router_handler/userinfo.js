const db = require('../db/index')
const bcrypt = require('bcryptjs')
exports.getUserInfo = async (req, res) => {
  //身份认证成功的话，express-jwt 会往req上挂载user属性
  try {
    const sqlStr = 'select id,username,status,user_pic from ev_users where id =?'
    const [results] = await db.query(sqlStr, req.user.id)
    if (results.length !== 1) return res.cc('获取用户信息失败！')
    res.send({
      status: 0,
      message: '获取用户基本信息成功',
      data: results[0]
    })
  } catch (err) {
    res.cc(err)
  }
}
exports.updateUserInfo = async (req, res) => {
  try {
    const sqlStr = 'update ev_users set ? where id = ?'
    const [results] = await db.query(sqlStr, [req.body, req.body.id])
    if (results.affectedRows !== 1) return res.cc('修改用户基本信息失败！')
    res.send('修改用户基本信息成功！')
  } catch (err) {
    res.cc(err)
  }
}
exports.updatePassword = async (req, res) => {
  try {
    const sqlStr = 'select * from ev_users where id =? '
    const [results] = await db.query(sqlStr, req.user.id)
    if (results.length !== 1) return res.cc('用户不存在')

    const compareResult = bcrypt.compareSync(req.body.oldPwd, results[0].password)
    if (!compareResult) return res.cc('旧密码错误')

    const sql = 'update ev_users set password = ? where id = ?'
    const newPwd = bcrypt.hashSync(req.body.newPwd, 10)
    const [updateResults] = await db.query(sql, [newPwd, req.user.id])
    if (updateResults.affectedRows !== 1) return res.cc('重置密码失败')
    res.cc('重置密码成功', 0)
  } catch (err) {
    res.cc(err)
  }
}
exports.updateAvator = async (req, res) => {
  try {
    const sqlStr = 'update ev_users set user_pic =? where id=?'
    const [results] = await db.query(sqlStr, [req.body.avator, req.user.id])
    if (results.affectedRows !== 1) return res.cc('更新头像失败！')
    res.cc('更新头像成功！', 0)
  } catch (err) {
    res.cc(err)
  }
}