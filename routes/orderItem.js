const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')

const router = express.Router()

// ADD ORDER ITEM
router.post('/', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const { OrderID, ProductID, Quantity } = req.body

  if (!OrderID || !ProductID || !Quantity || Quantity <= 0)
    return res.send(result.createResult('Invalid data'))

  // 🔹 Fetch product with IsActive
  const productSql = `
    SELECT Price, StockQuantity, IsActive
    FROM product
    WHERE ProductID = ?
  `

  pool.query(productSql, [ProductID], (err, rows) => {
    if (err) return res.send(result.createResult(err))

    if (rows.length === 0)
      return res.send(result.createResult('Product not found'))

    const product = rows[0]

    if (product.IsActive === 0)
      return res.send(
        result.createResult('Product Out Of Stock Or Unavailable')
      )

    if (product.StockQuantity < Quantity)
      return res.send(result.createResult('Insufficient stock'))

    const price = product.Price

    const itemSql = `INSERT INTO orderitem (OrderID, ProductID, Quantity, PriceAtPurchase) VALUES (?, ?, ?, ?)`

    pool.query(itemSql, [OrderID, ProductID, Quantity, price], err => {
      if (err) return res.send(result.createResult(err))

      const stockSql = `UPDATE product SET StockQuantity = StockQuantity - ? WHERE ProductID = ?`

      pool.query(stockSql, [Quantity, ProductID], err => {
        if (err) return res.send(result.createResult(err))

        const totalSql = `
        UPDATE orders
          SET 
            SubTotal = (
              SELECT SUM(Quantity * PriceAtPurchase)
              FROM orderitem
              WHERE OrderID = ?
            ),
            GSTAmount = (
              (SELECT SUM(Quantity * PriceAtPurchase)
               FROM orderitem
               WHERE OrderID = ?) * GSTPercentage / 100
            ),
            GrandTotal = (
              (SELECT SUM(Quantity * PriceAtPurchase)
               FROM orderitem
               WHERE OrderID = ?) +
              ((SELECT SUM(Quantity * PriceAtPurchase)
                FROM orderitem
                WHERE OrderID = ?) * GSTPercentage / 100)
            )
          WHERE OrderID = ?
        `

        pool.query(
          totalSql,
          [OrderID, OrderID, OrderID, OrderID, OrderID],
          err => res.send(
            result.createResult(err, 'Item added & stock updated')
          )
        )
      })
    })
  })
})

// GET ORDER ITEMS BY ORDER ID
router.get('/:orderId', (req, res) => {
  if (req.user.role !== 'RETAILER' && req.user.role !== 'ADMIN' && req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const sql = `
    SELECT oi.*, p.ProductName 
    FROM orderitem oi 
    JOIN product p ON oi.ProductID = p.ProductID 
    WHERE oi.OrderID = ?
  `

  pool.query(sql, [req.params.orderId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})


// GET OWN ORDERS (RETAILER)
router.get('/retailer/orders', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT * FROM orders WHERE RetailerID = ? ORDER BY OrderID DESC`
  pool.query(sql, [req.user.userId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// UPDATE DELIVERY STATUS (ADMIN / WHOLESALER)
router.patch('/:id/status', (req, res) => {
  if (!['ADMIN', 'WHOLESALER'].includes(req.user.role))
    return res.send(result.createResult('Access denied'))

  const sql = `UPDATE orders SET DeliveryStatus=? WHERE OrderID=?`
  pool.query(sql, [req.body.DeliveryStatus, req.params.id], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// calculate GST (RETAILER/ ADMIN / WHOLESALER)
router.get('/:id/gst', (req, res) => {
  const sql = ` SELECT OrderID, SubTotal,GSTPercentage,(SubTotal * GSTPercentage) / 100 AS GSTAmount,
                (SubTotal + (SubTotal * GSTPercentage) / 100) AS TotalAmount
                 FROM orders
                 WHERE OrderID = ? `
  pool.query(sql, [req.params.id], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// DELETE ORDER (ADMIN ONLY)
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query(
    `DELETE FROM orders WHERE OrderID=?`,
    [req.params.id],
    (err, data) => {
      res.send(result.createResult(err, data))
    }
  )
})

module.exports = router
