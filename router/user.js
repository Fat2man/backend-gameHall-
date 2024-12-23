const express = require('express')
const router = express.Router()
const user_hanlder = require('../router_handler/user')
const expressJoi = require('@escook/express-joi')
const { reg_schema, login_schema } = require('../schema/user')
const multer = require('multer')

// 设置存储路径和文件名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
// 使用Multer中间件配置上传
const upload = multer({ storage: storage })
router.post('/reguser', expressJoi(reg_schema), user_hanlder.reguser)
router.post('/login', expressJoi(login_schema), user_hanlder.login)
router.post('/uploadPicture', upload.single('file'), user_hanlder.uploadPicture)

module.exports = router