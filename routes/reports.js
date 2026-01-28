const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')

const router = express.Router()

// Pending Deliveries
router.get('/deliveries/pending', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query('CALL GetPendingDeliveries()', (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (!data || !data[0]) return res.send(result.createResult(null, []))
    res.send(result.createResult(null, data[0]))
  })
})

// Shipped Deliveries
router.get('/deliveries/shipped', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query('CALL GetShippedDeliveries()', (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (!data || !data[0]) return res.send(result.createResult(null, []))
    res.send(result.createResult(null, data[0]))
  })
})

// Cancelled Deliveries
router.get('/deliveries/cancelled', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query('CALL GetCancelledDeliveries()', (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (!data || !data[0]) return res.send(result.createResult(null, []))
    res.send(result.createResult(null, data[0]))
  })
})

// Delivered Deliveries
router.get('/deliveries/delivered', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query('CALL GetDeliverdDeliveries()', (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (!data || !data[0]) return res.send(result.createResult(null, []))
    res.send(result.createResult(null, data[0]))
  })
})


// GST Summary (Yearly)
router.get('/gst-summary', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const year = req.query.year || new Date().getFullYear()

  pool.query('CALL GetGSTSummary(?)', [year], (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (!data || !data[0]) return res.send(result.createResult(null, []))
    res.send(result.createResult(null, data[0]))
  })
})

// Monthly GST Matrix
router.get('/gst-matrix', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const year = req.query.year || new Date().getFullYear()

  pool.query('CALL GetMonthlyGSTMatrix(?)', [year], (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (!data || !data[0]) return res.send(result.createResult(null, []))
    res.send(result.createResult(null, data[0]))
  })
})


// Paid Payments
router.get('/payments/paid', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query('CALL GetPaidPaymentsReport()', (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (!data || !data[0]) return res.send(result.createResult(null, []))
    res.send(result.createResult(null, data[0]))
  })
})

// Failed Payments
router.get('/payments/failed', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query('CALL GetFailedPaymentsReport()', (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (!data || !data[0]) return res.send(result.createResult(null, []))
    res.send(result.createResult(null, data[0]))
  })
})

// Pending Payments
router.get('/payments/pending', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query('CALL GetPendingPaymentsReport()', (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (!data || !data[0]) return res.send(result.createResult(null, []))
    res.send(result.createResult(null, data[0]))
  })
})


// Retailer Orders Report
router.get('/retailers', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query('SELECT * FROM retailerordersreport', (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// Wholesaler Product Report
router.get('/wholesalers', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query('SELECT * FROM wholesalerproductreport', (err, data) => {
    res.send(result.createResult(err, data))
  })
})

module.exports = router