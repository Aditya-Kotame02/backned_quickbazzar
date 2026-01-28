const mysql = require('mysql2')
const fs = require('fs')
const path = require('path')

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, '../aiven-ca.pem'))
  }
})

// TEMP TEST
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ DB connection failed:', err)
  } else {
    console.log('✅ DB connected successfully')
    conn.release()
  }
})

module.exports = pool