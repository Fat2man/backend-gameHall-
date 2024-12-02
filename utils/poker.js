//准备牌
const colorList = ["♦", "♣", "♠", "♥"]  //花色
const numberList = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"]  //牌值
const pokerList = new Map()  //扑克牌键值对对象
// 牌面大小顺序，用于排序
const order = {
  '大王': 17, '小王': 16,
  '2': 15, 'A': 14, 'K': 13,
  'Q': 12, 'J': 11, '10': 10,
  '9': 9, '8': 8, '7': 7,
  '6': 6, '5': 5, '4': 4,
  '3': 3
};
// 牌型类型
const CARD_TYPES = {
  SINGLE: 'single',      // 单张
  PAIR: 'pair',          // 对子
  TRIO: 'trio',          // 三张
  TRIO_WITH_SINGLE: 'trio_with_single',  // 三带一
  TRIO_WITH_PAIR: 'trio_with_pair',  // 三带一对
  STRAIGHT: 'straight',  // 顺子
  PLANE: 'plane', //飞机
  CONNECTED_PAIRS: 'connected_pairs', // 连对
  FOUR_WITH_TWO: 'four_with_two',     // 四带二
  BOMB: 'bomb',          // 炸弹
  KING_BOMB: 'king_bomb', // 王炸
  INVALID: 'invalid'     // 无效牌型
};
let index = 1   //牌的序号    1-13分别对应  "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"
for (let i = 0; i < numberList.length; i++) {
  for (let j = 0; j < colorList.length; j++) {
    pokerList.set(index++, colorList[j] + numberList[i])   //1-♦3  2-♣3  3-♠3  4-♥3  5-♦4......
  }
}
pokerList.set(index++, "小王")
pokerList.set(index, "大王")
Map.prototype.shuffle = function () {  //洗牌算法，挂载到Map原型上
  let array = [...this.keys()]  //返回map对象键的数组
  let m = array.length, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    [array[m], array[i]] = [array[i], array[m]]
  }
  const newMap = new Map() //洗牌后的map对象
  for (let i = 0; i < array.length; i++) {
    newMap.set(array[i], this.get(array[i]))
  }
  return newMap;
}

// 获取牌的值，用于比较排序
function getCardValue(card) {
  // 如果是大小王，直接返回它们的权值
  if (card === '大王' || card === '小王') {
    return order[card];
  }
  // 否则提取出数字部分
  let value = card.slice(1);
  return order[value];
}
function deal() {  //发牌+玩家手牌排序
  let pokerShuffleList = pokerList.shuffle()  //洗牌后的map对象
  let lord = [], player1 = [], player2 = [], player3 = []  //底牌 + 玩家手牌
  let pokerShuffleListCopy = [...pokerShuffleList.values()]  //map对象转为数组
  for (let i = 0; i < pokerShuffleListCopy.length; i++) {
    if (i < 3) {
      lord.push(pokerShuffleListCopy[i])
    } else {
      if (i % 3 == 0) {
        player1.push(pokerShuffleListCopy[i])
      } else if (i % 3 == 1) {
        player2.push(pokerShuffleListCopy[i])
      } else {
        player3.push(pokerShuffleListCopy[i])
      }
    }
  }
  // 对玩家手牌进行排序
  player1.sort((a, b) => getCardValue(b) - getCardValue(a));
  player2.sort((a, b) => getCardValue(b) - getCardValue(a));
  player3.sort((a, b) => getCardValue(b) - getCardValue(a));
  lord.sort((a, b) => getCardValue(b) - getCardValue(a));

  return { lord, player1, player2, player3 }
}
// 判断牌型
function getCardType(cards) {
  if (cards.length === 1) {
    return { type: CARD_TYPES.SINGLE, rank: getCardValue(cards[0]) };
  }
  if (cards.length === 2) {
    if (cards[0].includes('王') && cards[1].includes('王')) {
      return { type: CARD_TYPES.KING_BOMB, rank: getCardValue(cards[0]) };  //王炸
    } else if (getCardValue(cards[0]) === getCardValue(cards[1])) {
      return { type: CARD_TYPES.PAIR, rank: getCardValue(cards[0]) }; //对子
    }
  }
  if (cards.length === 3 && getCardValue[cards[0]] === getCardValue[cards[1]] && getCardValue[cards[1]] === getCardValue[cards[2]]) {
    return { type: CARD_TYPES.TRIO, rank: getCardValue[0] };  //三不带
  }
  if (cards.length === 4) {
    if (cards.every(c => getCardValue(c) === getCardValue(cards[0]))) {
      return { type: CARD_TYPES.BOMB, rank: getCardValue(cards[0]) }; //炸弹
    } else if (cards.slice(0, 3).every(c => getCardValue(c) === getCardValue(cards[0]))) {
      return { type: CARD_TYPES.TRIO_WITH_SINGLE, rank: getCardValue(cards[0]) }; // 三带一
    } else if (cards.slice(1).every(c => getCardValue(c) === getCardValue(cards[3]))) {
      return { type: CARD_TYPES.TRIO_WITH_SINGLE, rank: getCardValue(cards[3]) }; // 三带一
    }
  }
  if (cards.length === 5) {
    const firstThreeSame = cards.slice(0, 3).every(c => getCardValue(c) === getCardValue(cards[0]));  //前三张牌相同
    const lastTwoSame = cards.slice(3, 5).every(c => getCardValue(c) === getCardValue(cards[3]));  //后两张牌相同
    const lastThreeSame = cards.slice(2, 5).every(c => getCardValue(c) === getCardValue(cards[2]));  //后三张牌相同
    const firstTwoSame = cards.slice(0, 2).every(c => getCardValue(c) === getCardValue(cards[0]));  //前两张牌相同
    if (firstThreeSame && lastTwoSame) {
      return { type: CARD_TYPES.TRIO_WITH_PAIR, rank: getCardValue(cards[0]) }; // 三带一对
    } else if (lastThreeSame && firstTwoSame) {
      return { type: CARD_TYPES.TRIO_WITH_PAIR, rank: getCardValue(cards[2]) }; // 三带一对
    }
  }
  const planeType = getPlaneType(cards);
  if (planeType) {
    return planeType; // 飞机
  }
  const connectedPairsType = getConnectedPairs(cards);
  if (connectedPairsType) {
    return connectedPairsType; // 连对
  }
  const fourWithTwoType = getFourWithTwo(cards);
  if (fourWithTwoType) {
    return fourWithTwoType; // 四带二
  }
  if (isStraight(cards)) {
    return { type: CARD_TYPES.STRAIGHT, rank: cards[cards.length - 1] };  //顺子
  }
  return { type: CARD_TYPES.INVALID, rank: null };  //无牌组
}
// 判断连对
function getConnectedPairs(cards) {
  const cardCounts = {};
  cards = cards.map(card => card.slice(1))
  cards.forEach(card => {
    cardCounts[card] = (cardCounts[card] || 0) + 1;
  });
  const CARD_RANKS = numberList.concat(['小王', '大王'])  //54张牌的全部键值
  const pairs = Object.keys(cardCounts).filter(card => cardCounts[card] === 2);
  if (pairs.length < 3) return null; // 至少需要三个对子

  const isContinuous = pairs.every((pair, index) => {
    if (index === 0) return true;
    return Math.abs(CARD_RANKS.indexOf(pair) - CARD_RANKS.indexOf(pairs[index - 1])) === 1;
  });
  if (isContinuous) {
    return { type: CARD_TYPES.CONNECTED_PAIRS, rank: pairs[pairs.length - 1] };
  }
  return null;
}
// 判断四带二
function getFourWithTwo(cards) {
  const cardCounts = {};
  cards = cards.map(card => card.slice(1))
  cards.forEach(card => {
    cardCounts[card] = (cardCounts[card] || 0) + 1;
  });
  const fours = Object.keys(cardCounts).filter(card => cardCounts[card] === 4);
  if (fours.length === 0) return null; // 至少需要一组四张牌
  const remainingCards = cards.filter(card => cardCounts[card] < 4);
  if (remainingCards.length < 2) return null; // 需要至少两张带出的牌
  return { type: CARD_TYPES.FOUR_WITH_TWO, rank: fours[0] }; // 返回四带二的牌型
}
// 判断顺子
function isStraight(cards) {
  if (cards.length < 5 || cards.includes("2") || cards.includes("小王") || cards.includes("大王")) {
    return false; // 2、小王 和 大王 不能参与顺子
  }
  for (let i = 0; i < cards.length - 1; i++) {
    let lastValue = getCardValue(cards[i + 1])
    let currentValue = getCardValue(cards[i])
    if (Math.abs(lastValue - currentValue) !== 1) {
      return false;
    }
  }
  return true;
}
// 判断飞机
function getPlaneType(cards) {
  const cardCounts = {};
  cards.forEach(card => {
    card = card.slice(1)
    cardCounts[card] = (cardCounts[card] || 0) + 1;
  });

  const trios = Object.keys(cardCounts).filter(card => cardCounts[card] >= 3);
  if (trios.length < 2) return null; // 至少需要两组三张牌
  const validPlanes = [];
  const CARD_RANKS = numberList.concat(['小王', '大王'])  //54张牌的全部键值
  for (let i = 0; i < trios.length; i++) {
    const trioRank = trios[i];
    const nextRankIndex = CARD_RANKS.indexOf(trioRank) + 1;
    if (nextRankIndex < CARD_RANKS.length) {
      const nextTrio = CARD_RANKS[nextRankIndex];
      if (trios.includes(nextTrio)) {
        validPlanes.push([trioRank, nextTrio]);
      }
    }
  }
  // 如果找到了有效的飞机
  if (validPlanes.length > 0) {
    const carryCount = cards.length - validPlanes.length * 3; // 剩余牌数
    const allCarrySameType = (carryCount === 0 || (carryCount % 2 === 0 || carryCount / 2 === validPlanes.length)); // 检查带出的牌类型统一

    if (allCarrySameType) {
      let rank = getCardValue(validPlanes[validPlanes.length - 1])
      return { type: CARD_TYPES.PLANE, rank };
    }
  }
  return null;
}
// 比较牌大小
function compareCards(currentPlay, lastPlay) {
  const currentType = getCardType(currentPlay);
  const lastType = getCardType(lastPlay);
  if (lastType.type === CARD_TYPES.INVALID && currentType.type !== CARD_TYPES.INVALID) {
    if (currentType.type === 'single' || currentType.type === 'pair') {   //如果为单张为对子，直接返回。否则返回‘follow’供前端播放“管上（压死）”语音 
      return { flag: currentType.rank > lastType.rank, type: currentType.type === 'single' ? currentType.rank : `${currentType.rank}${currentType.rank}` }   //返回具体的牌值供前端语音播报
    }
    return { flag: true, type: currentType.type }; // 首次出牌，没有历史记录，直接返回true
  }
  if (currentType.type === CARD_TYPES.INVALID) {
    return { flag: false, type: currentType.type }; // 无效牌型
  }
  if (currentType.type === CARD_TYPES.KING_BOMB) {
    return { flag: true, type: currentType.type }; // 王炸最大
  }
  if (currentType.type === CARD_TYPES.BOMB && lastType.type !== CARD_TYPES.BOMB) {
    return { flag: true, type: currentType.type }; // 炸弹可以压一切非炸弹
  }
  if (currentType.type !== lastType.type) {
    return { flag: false, type: currentType.type }; // 牌型不同不能比较
  }
  if (currentType.type === 'pair' || currentType.type === 'single') {   //如果为单张为对子，直接返回。否则返回‘follow’供前端播放“管上（压死）”语音 
    return { flag: currentType.rank > lastType.rank, type: currentType.type === 'single' ? currentType.rank : `${currentType.rank}${currentType.rank}` }   //返回具体的牌值供前端语音播报
  }
  return { flag: currentType.rank > lastType.rank, type: 'follow' }
}
// 获取上一手或上上手牌
function getPreviousPlay(playHistory) {
  let index1 = playHistory.length - 1;
  if (index1 >= 0) {
    if (playHistory[index1]?.obj.length) return playHistory[index1];  //如果上一个玩家有出牌，直接返回，否则取上上个玩家的出牌记录
    let index2 = playHistory.length - 2
    if (index2 > 0) {
      if (playHistory[index2]?.obj.length) return playHistory[index2];
    }
  }
  return null; // 没有历史记录时返回
}
// 轮流出牌
function playTurn(id, cards, playHistory) {
  cards.sort((a, b) => getCardValue(b) - getCardValue(a));
  const previousPlay = getPreviousPlay(playHistory); // 获取上一手牌
  const { flag, type } = compareCards(cards, previousPlay?.obj ?? [])
  if (previousPlay?.id !== id && !flag) {
    return { flag: false, type }  //出牌失败
  } else {
    return { flag: true, type }   //出牌成功
  }
}

// function calculateScore(winner, losers) {
//   const sqlStr = 'select score from ev_users where username in (?,?,?)'
//   const player = [winner].concat(losers)
//   return new Promise((resolve, reject) => {
//     db.query(sqlStr, player, (err, results) => {
//       console.log("🚀 ~ db.query1 ~ results:", results)
//       if (err) return reject(err)
//       if (results.length !== 3) return reject('获取玩家信息失败')
//       const params = [
//         winner, results[0].score + 1000,
//         losers[0], results[1].score - 500,
//         losers[1], results[2].score - 500,
//         winner, losers[0], losers[1]
//       ];
//       const sqlStr1 = `
//         UPDATE ev_users SET score = CASE username
//         WHEN ? THEN ?
//         WHEN ? THEN ?
//         WHEN ? THEN ?
//         ELSE score
//         END
//         WHERE username IN (?, ?, ?);
//       `;
//       db.query(sqlStr1, params, (err, results) => {
//         console.log("🚀 ~ db.query2 ~ results:", results)
//         if (err) return reject(err)
//         if (results.affectedRows !== 3) return reject('数据更新失败！')
//         const sqlStr2 = `SELECT * FROM ev_users WHERE username in (?,?,?)`;
//         db.query(sqlStr2, player, (err, results) => {
//           console.log("🚀 ~ db.query3 ~ results:", results)
//           if (err) return reject(err)
//           if (results.length !== 3) return reject('数据查询失败！')
//           resolve(results)
//         })
//       })
//     })
//   })
// }
const db = require('../db/index')  //连接数据库
async function calculateScore(winner, losers) { // 异步函数处理事务，游戏结算  
  const connection = await db.getConnection();
  try {
    // 开始事务
    await connection.beginTransaction();
    const sqlStr1 = 'select score from ev_users where username in (?,?,?)'
    const player = [winner].concat(losers)
    const players = [winner].concat(losers)
    const results = await db.query(sqlStr1, player)
    const params = [
      winner, results[0].score + 1000,
      losers[0], results[1].score - 500,
      losers[1], results[2].score - 500,
      winner, losers[0], losers[1]
    ];
    // 执行第一个查询
    await connection.query('SELECT score FROM ev_users WHERE username in (?,?,?)', players);
    const sqlStr2 = `
      UPDATE ev_users SET score = CASE username
      WHEN ? THEN ?
      WHEN ? THEN ?
      WHEN ? THEN ?
      ELSE score
      END
      WHERE username IN (?, ?, ?);
    `;
    // 执行第二个查询
    await connection.query(sqlStr2, params);
    const result = await connection.query(`SELECT * FROM ev_users WHERE username in (?,?,?)`, players);
    // 提交事务
    await connection.commit();
    return result
  } catch (err) {
    // 如果发生错误，回滚事务
    await connection.rollback();
    res.cc(err)
  } finally {
    // 确保释放连接
    connection.release();
  }
}
module.exports = { deal, getCardValue, playTurn, calculateScore }  //发牌 排序






