const joi = require('joi')
/*
 * string() 值必须是字符串
 * alphanum() 值只能是包含 a-zA-Z0-9 的字符串
 * min(length) 最小长度
 * max(length) 最大长度
 * required() 值是必填项，不能为 undefined
 * pattern(正则表达式) 值必须符合正则表达式的规则
 */
const username = joi.string().alphanum().min(1).max(20).required()
const password = joi.string().pattern(/^[\S]{6,12}$/).required()
const avatar = joi.string().required()
const id = joi.number().integer().min(1).required()
const email = joi.string().email().required()
const nickname = joi.string().required()
const file = joi.string().required()
exports.login_schema = {
  body: {
    username,
    password
  }
}
exports.reg_schema = {
  body: {
    username,
    password,
    avatar
  }
}
exports.update_userinfo_schema = {
  body: {
    id,
    nickname,
    email
  }
}
exports.update_password_schema = {
  body: {
    oldPwd: password,
    newPwd: joi.not(joi.ref('oldPwd')).concat(password)
  }
}
// exports.update_avatar_schema = {
//   body: {
//     file
//   }
// }