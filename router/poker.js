const express = require('express')
const router = express.Router()
const poker = require('../router_handler/poker')
router.get('/getPokerList', poker.getPoker)
module.exports = router