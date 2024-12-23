const mysql = require('mysql2')

const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'test',
  password: 'zjj123000',
  database: 'my_db_01',
  port: '3306',
  multipleStatements: true // 允许同时执行多条语句
})
const promisePool = db.promise(); // 使用 promise 接口，便于使用 async/await
module.exports = promisePool