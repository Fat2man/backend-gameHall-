const mysql = require('mysql')

const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'Zjj123000',
  database: 'my_db_01',
  port: '3306',
  multipleStatements: true // 允许同时执行多条语句
})

module.exports = db