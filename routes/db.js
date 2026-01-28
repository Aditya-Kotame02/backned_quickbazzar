pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ DB connection failed:', err)
  } else {
    console.log('✅ DB connected successfully')
    conn.release()
  }
})
