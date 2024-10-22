const deal = require('../utils/poker')
let poker = deal()
exports.getPoker = (req, res) => {
  res.send({
    status: 0,
    message: '成功',
    poker
  })
}
