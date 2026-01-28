const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')
const authorizeUser = require('../utils/authuser')

const router = express.Router()

router.post('/add', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const userId = req.user.userId

  const { businessName, contactNumber, address, gstNumber } = req.body

  if (!businessName || !contactNumber || !address || !gstNumber) {
    return res.send(result.createResult('Missing required fields'))
  }

  const checkSql = `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

  pool.query(checkSql, [userId], (err, rows) => {
  if (err) return res.send(result.createResult(err))
  if (rows.length > 0)
    return res.send(result.createResult('Already registered'))
  
    const insertSql = `
      INSERT INTO wholesaler (UserID, BusinessName, ContactNumber, Address, GSTNumber) VALUES (?, ?, ?, ?, ?)`

    pool.query(
      insertSql,
      [userId, businessName, contactNumber, address, gstNumber],
      (err, data) => {
        res.send(result.createResult(err, data))
      }
    )
  })
})

router.get("/dashboard", authorizeUser, (req, res) => {
  if (req.user.role !== "WHOLESALER") {
    return res.send(result.createResult("Access denied"))
  }
  const userId = req.user.userId
  const wholesalerSql ="SELECT WholesalerID FROM wholesaler WHERE UserID = ?"
  pool.query(wholesalerSql, [userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))
    if (rows.length === 0)
      return res.send(result.createResult("Wholesaler profile not found"))

    const wholesalerId = rows[0].WholesalerID
    const statsSql = `SELECT (SELECT COUNT(*) FROM product WHERE WholesalerID = ? AND IsActive = 1) AS totalProducts,
                      (SELECT COUNT(DISTINCT oi.OrderID) FROM orderitem oi JOIN product p ON oi.ProductID = p.ProductID WHERE p.WholesalerID = ?) AS totalOrders,
                      (SELECT IFNULL(SUM(oi.Quantity * oi.PriceAtPurchase), 0) FROM orderitem oi JOIN product p ON oi.ProductID = p.ProductID JOIN orders o ON oi.OrderID = o.OrderID WHERE p.WholesalerID = ?
                      AND o.DeliveryStatus = 'DELIVERED') AS revenue`

    pool.query(statsSql,[wholesalerId, wholesalerId, wholesalerId],(err, data) => {
        if (err) return res.send(result.createResult(err))
        res.send(result.createResult(null, data[0]))
      }
    )
  })
})

router.get('/my', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const userId = req.user.userId

  const sql = `
    SELECT WholesalerID, BusinessName, ContactNumber, Address, GSTNumber
    FROM wholesaler
    WHERE UserID = ?
  `

  pool.query(sql, [userId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

router.get('/profile', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const userId = req.user.userId

  const sql = `
    SELECT 
      u.UserID,
      u.Name,
      u.Email,
      w.WholesalerID,
      w.BusinessName,
      w.ContactNumber,
      w.Address,
      w.GSTNumber
    FROM users u
    LEFT JOIN wholesaler w ON u.UserID = w.UserID
    WHERE u.UserID = ?
  `

  pool.query(sql, [userId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

router.put('/update', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const userId = req.user.userId
  const { businessName, contactNumber, address, gstNumber } = req.body

  if (!businessName || !contactNumber || !address || !gstNumber)
    return res.send(result.createResult('Missing fields'))

  const sql = `
    UPDATE wholesaler
    SET BusinessName = ?, ContactNumber = ?, Address = ?, GSTNumber = ?
    WHERE UserID = ?
  `

  pool.query(
    sql,
    [businessName, contactNumber, address, gstNumber, userId],
    (err, data) => {
      res.send(result.createResult(err, data))
    }
  )
})

router.get('/retailer/all', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT w.WholesalerID, w.BusinessName, w.ContactNumber, w.Address, w.GSTNumber FROM wholesaler w`

  pool.query(sql, (err, data) => {
    res.send(result.createResult(err, data))
  })
})

module.exports = router
