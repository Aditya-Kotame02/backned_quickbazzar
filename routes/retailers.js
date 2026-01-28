const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')
const router = express.Router()


// GET ALL RETAILERS (ADMIN / WHOLESALER)
router.get('/all', (req, res) => {
  if (!['ADMIN', 'WHOLESALER'].includes(req.user.role))
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT * FROM retailer`
  pool.query(sql, (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// GET OWN PROFILE RETAILER (RETAILER)
router.get('/my', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT * FROM retailer WHERE UserID = ?`
  pool.query(sql, [req.user.userId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// ADD RETAILER (RETAILER ONLY)
router.post('/add', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const { shopName, contactNumber, address, gstNumber } = req.body
  const userId = req.user.userId

  const sql = `INSERT INTO retailer (UserID, ShopName, ContactNumber, Address, GSTNumber) VALUES (?, ?, ?, ?, ?)`

  pool.query(sql,[userId, shopName, contactNumber, address, gstNumber],(err, data) => {
      res.send(result.createResult(err, data))
    }
  )
})

// Update Retailer Profile (RETAILER & ADMIN)
router.put('/update/:id', (req, res) => {
  // ROLE CHECK
  if (req.user.role !== 'ADMIN' && req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))
  const { shopName, contactNumber, address, gstNumber } = req.body

  if (!shopName || !contactNumber || !address || !gstNumber)
    return res.send(result.createResult('All fields are required'))

  let sql
  let params

  // ADMIN can update any retailer
  if (req.user.role === 'ADMIN') {
    sql = `UPDATE retailer SET ShopName = ?, ContactNumber = ?, Address = ?, GSTNumber = ? WHERE RetailerID = ?`
    params = [shopName, contactNumber, address, gstNumber, req.params.id]
  }

  // RETAILER can update only their own retailer profile
  else {
    sql = `UPDATE retailer SET ShopName = ?, ContactNumber = ?, Address = ?, GSTNumber = ? WHERE RetailerID = ? AND UserID = ?`
    params = [shopName, contactNumber, address, gstNumber, req.params.id, req.user.userId]
  }

  pool.query(sql, params, (err, data) => {
    if (!err && data.affectedRows === 0)
      return res.send(result.createResult('Retailer not found or unauthorized'))
    res.send(result.createResult(err, data))
  })
})

// GET RETAILER WALLET Balance(RETAILER AND ADMIN)
router.get('/wallet/:id', (req, res) => {
  // ROLE CHECK
  if (req.user.role !== 'ADMIN' && req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  let sql
  let params

  // ADMIN can view retailer wallet
  if (req.user.role === 'ADMIN') {
    sql = `SELECT WalletBalance from retailer WHERE RetailerID = ?`
    params = [req.params.id]
  }

  // RETAILER can view only their own wallet
  else {
    sql = `SELECT WalletBalance from retailer WHERE RetailerID = ? AND UserID = ?`
    params = [req.params.id, req.user.userId]
  }

  pool.query(sql, params, (err, data) => {
    if (!err && data.affectedRows === 0)
      return res.send(result.createResult('Retailer not found or unauthorized'))
    res.send(result.createResult(err, data))
  })
})

// Update Retailer Wallet Balance (RETAILER & ADMIN)
router.patch('/update/wallet/:id', (req, res) => {
  // ROLE CHECK
  if (req.user.role !== 'ADMIN' && req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))
  const {WalletBalance} = req.body

  if (!WalletBalance)
    return res.send(result.createResult('Amount is required'))

  let sql
  let params

  // ADMIN can update any retailer's wallet
  if (req.user.role === 'ADMIN') {
    sql = `UPDATE retailer SET WalletBalance = WalletBalance + ? WHERE RetailerID = ?`
    params = [WalletBalance, req.params.id]
  }

  // RETAILER can update only their own retailer wallet balance
  else {
    sql = `UPDATE retailer SET WalletBalance = WalletBalance + ? WHERE RetailerID = ? AND UserID = ?`
    params = [WalletBalance, req.params.id, req.user.userId]
  }

  pool.query(sql, params, (err, data) => {
    if (!err && data.affectedRows === 0)
      return res.send(result.createResult('Retailer not found or unauthorized'))
    res.send(result.createResult(err,'Wallet updated successfully'))
  })
})

module.exports = router
