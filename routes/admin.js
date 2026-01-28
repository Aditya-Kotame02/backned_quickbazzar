const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')

const router = express.Router()

//USER RELATED API's

// GET ALL USERS (ADMIN ONLY) 
router.get('/user/all', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT UserID, Name, Email, Role FROM users` 
  pool.query(sql,(err, data) =>{
    res.send(result.createResult(err, data))
  })
})


// DELETE USER (ADMIN ONLY)
router.delete('/delete-user/:userId', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const { userId } = req.params
  const sql = `DELETE FROM users WHERE UserID=?`

  pool.query(sql, [userId],(err, data) => {
    res.send(result.createResult(err, data))
  })
})

//GET USER By ID (ADMIN ONLY)
router.get('/user/:id', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT UserID, Name, Email, Role FROM users WHERE UserID=?`

  pool.query(sql, [req.params.id], (err, data) => {
    if (data.length === 0)
      return res.send(result.createResult('User not found'))

    res.send(result.createResult(err, data[0]))
  })
})

//UPDATE USER BY ID (ADMIN ONLY)
router.patch('/user/:id', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const { email, role } = req.body
  const sql = `UPDATE users SET Email=?, Role=? WHERE UserID=?`

  pool.query(sql, [email, role, req.params.id], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

//RETAILER RELATED API's

// GET ALL RETAILERS (ADMIN / WHOLESALER)
router.get('/all', (req, res) => {
  if (!['ADMIN', 'WHOLESALER'].includes(req.user.role))
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT * FROM retailer`
  pool.query(sql, (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// GET RETAILER BY ID (ADMIN)
router.get('/find/:id', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT * FROM retailer WHERE RetailerID = ?`

  pool.query(sql, [req.params.id], (err, data) => {
    if (!err && data.length === 0)
      return res.send(result.createResult('Retailer not found'))

    res.send(result.createResult(err, data[0]))
  })
})

// DELETE RETAILER (ADMIN ONLY)
router.delete('/delete-retailer/:id', (req, res) => {
    if (req.user.role !== 'ADMIN')
        return res.send(result.createResult('Access denied'))
    const sql = `DELETE FROM users WHERE UserID = ? AND Role = 'RETAILER'`
    pool.query(sql, [req.params.id], (err, data) => {
        res.send(result.createResult(err, data))
    })
})

//WHOLESALER RELATED API's 

// GET ALL WHOLESALERS (ADMIN ONLY)
router.get('/wholesalers', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT WholesalerID, UserID, BusinessName, ContactNumber, Address, GSTNumber, SubscriptionPlan FROM wholesaler`

  pool.query(sql, (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// GET WHOLESALER PROFILE (ADMIN / SELF)
router.get('/wholesaler/:id', (req, res) => {
  const { id } = req.params
  let sql
  let params

  if (req.user.role === 'ADMIN') {
    sql = `SELECT BusinessName, ContactNumber, Address, GSTNumber FROM wholesaler WHERE WholesalerID = ?`
    params = [id]
  } 
  else if (req.user.role === 'WHOLESALER') {
    sql = `SELECT BusinessName, ContactNumber, Address, GSTNumber FROM wholesaler WHERE WholesalerID = ? AND UserID = ?`
    params = [id, req.user.userId]
  } 
  else {
    return res.send(result.createResult('Access denied'))
  }

  pool.query(sql, params, (err, data) => {
    if (!err && data.length === 0)
      return res.send(result.createResult('Wholesaler not found'))

    res.send(result.createResult(err, data[0]))
  })
})


// UPDATE WHOLESALER PROFILE (ADMIN / SELF)
router.put('/wholesaler/:id', (req, res) => {
  const { businessName, contactNumber, address, gstNumber } = req.body

  if (!businessName || !contactNumber || !address || !gstNumber)
    return res.send(result.createResult('All fields are required'))

  let sql
  let params

  if (req.user.role === 'ADMIN') {
    sql = `UPDATE wholesaler SET BusinessName = ?, ContactNumber = ?, Address = ?, GSTNumber = ? WHERE WholesalerID = ?`
    params = [businessName, contactNumber, address, gstNumber, req.params.id]
  } 
  else if (req.user.role === 'WHOLESALER') {
    sql = `UPDATE wholesaler SET BusinessName = ?, ContactNumber = ?, Address = ?, GSTNumber = ? WHERE WholesalerID = ? AND UserID = ?`
    params = [businessName, contactNumber, address, gstNumber, req.params.id, req.user.userId]
  } 
  else {
    return res.send(result.createResult('Access denied'))
  }

  pool.query(sql, params, (err, data) => {
    if (!err && data.affectedRows === 0)
      return res.send(result.createResult('Wholesaler not found or unauthorized'))

    res.send(result.createResult(err, data))
  })
})

// DELETE WHOLESALER (ADMIN ONLY)
router.delete('/wholesaler/:userId', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `DELETE FROM users WHERE UserID = ? AND Role = 'WHOLESALER'`

  pool.query(sql, [req.params.userId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

//Product's Related API's

// GET ALL PRODUCTS (ADMIN)
router.get('/product/all', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT p.*, w.BusinessName FROM product p JOIN wholesaler w ON p.WholesalerID = w.WholesalerID ORDER BY p.ProductID DESC`

  pool.query(sql, (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// GET PRODUCTS BY WHOLESALER (ADMIN)
router.get('/product/wholesaler/:id', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT * FROM product WHERE WholesalerID = ?`

  pool.query(sql, [req.params.id], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// DELETE PRODUCT (ADMIN)
router.delete('/product/:id', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `DELETE FROM product WHERE ProductID = ?`

  pool.query(sql, [req.params.id], (err, data) => {
    if (!err && data.affectedRows === 0)
      return res.send(result.createResult('Product not found'))

    res.send(result.createResult(err, {
      message: 'Product deleted by admin'
    }))
  })
})

// BLOCK / UNBLOCK PRODUCT (ADMIN)
router.patch('/product/status/:id/', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const { IsActive } = req.body

  const sql = `UPDATE product SET IsActive=? WHERE ProductID=?`

  pool.query(sql, [IsActive, req.params.id], (err, data) => {
    res.send(result.createResult(err, {
      message: IsActive ? 'Product enabled' : 'Product blocked'
    }))
  })
})

// LOW STOCK PRODUCTS (ADMIN)
router.get('/product/low-stock', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT * FROM product WHERE StockQuantity < 10 ORDER BY StockQuantity ASC`

  pool.query(sql, (err, data) => {
    res.send(result.createResult(err, data))
  })
})



// GET SYSTEM SUMMARY (ADMIN ONLY)
router.get('/summary', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT (SELECT COUNT(*) FROM users) AS totalUsers,(SELECT COUNT(*) FROM retailer) AS totalRetailers, 
    (SELECT COUNT(*) FROM wholesaler) AS totalWholesalers,(SELECT COUNT(*) FROM orders) AS totalOrders,
    (SELECT SUM(GrandTotal) FROM orders WHERE PaymentStatus = 'PAID') AS totalRevenue,(SELECT SUM(GSTAmount) FROM orders WHERE PaymentStatus = 'PAID') AS totalGST,
    (SELECT COUNT(*) FROM product) AS totalProducts`

  pool.query(sql, (err, data) => {
    res.send(result.createResult(err, data[0]))
  })
})

// Recalculates GSTAmount & GrandTotal based on GSTPercentage
router.post('/recalculate-gst', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `UPDATE orders SET GSTAmount = (SubTotal * GSTPercentage) / 100`

  pool.query(sql, (err, data) => {
    if (err) return res.send(result.createResult(err))

    res.send(result.createResult(null, {
      message: 'GST recalculated successfully',
      affectedOrders: data.affectedRows
    }))
  })
})


module.exports = router

