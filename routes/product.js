const express = require('express')
const upload = require('../utils/multer')
const pool = require('../utils/db')
const result = require('../utils/result')
const authorizeUser = require('../utils/authuser')

const router = express.Router()

// =======================
// ADD PRODUCT
// =======================
router.post(
  '/',
  authorizeUser,
  upload.single('ProductImage'),
  (req, res) => {
    if (req.user.role !== 'WHOLESALER')
      return res.send(result.createResult('Access denied'))

    const { ProductName, Category, Price, StockQuantity, Description } = req.body

    if (!ProductName || !Price)
      return res.send(result.createResult('Missing required fields'))

    const findWholesalerSql =
      `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

    pool.query(findWholesalerSql, [req.user.userId], (err, rows) => {
      if (err) return res.send(result.createResult(err))
      if (rows.length === 0)
        return res.send(result.createResult('Wholesaler profile not found'))

      const sql = `
        INSERT INTO product
        (ProductName, Category, Price, StockQuantity, WholesalerID, ProductImage, Description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `

      const params = [
        ProductName,
        Category || null,
        Price,
        StockQuantity || 0,
        rows[0].WholesalerID,
        req.file ? req.file.path : null, // ✅ Cloudinary URL
        Description || null
      ]

      pool.query(sql, params, (err, data) =>
        res.send(result.createResult(err, data))
      )
    })
  }
)

// =======================
// GET MY PRODUCTS (WHOLESALER)
// =======================
router.get('/products/my-products', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const sql = `
    SELECT p.*
    FROM product p
    JOIN wholesaler w ON p.WholesalerID = w.WholesalerID
    WHERE w.UserID = ? AND p.IsActive = 1
    ORDER BY p.ProductID DESC
  `

  pool.query(sql, [req.user.userId], (err, data) =>
    res.send(result.createResult(err, data))
  )
})

// =======================
// GET ALL PRODUCTS
// =======================
router.get('/all', (req, res) => {
  const sql = `SELECT * FROM product WHERE IsActive = 1`
  pool.query(sql, (err, data) =>
    res.send(result.createResult(err, data))
  )
})

// =======================
// SEARCH PRODUCT
// =======================
router.get('/search/:name', (req, res) => {
  const sql = `
    SELECT * FROM product
    WHERE ProductName LIKE ? AND IsActive = 1
  `
  pool.query(sql, [`%${req.params.name}%`], (err, data) =>
    res.send(result.createResult(err, data))
  )
})

// =======================
// GET BY CATEGORY
// =======================
router.get('/category/:category', (req, res) => {
  const sql = `
    SELECT * FROM product
    WHERE Category = ? AND IsActive = 1
  `
  pool.query(sql, [req.params.category], (err, data) =>
    res.send(result.createResult(err, data))
  )
})

// =======================
// GET PRODUCT BY ID
// =======================
router.get('/:id', (req, res) => {
  const sql = `
    SELECT * FROM product
    WHERE ProductID = ? AND IsActive = 1
  `
  pool.query(sql, [req.params.id], (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (data.length === 0)
      return res.send(result.createResult('Product not found'))

    res.send(result.createResult(null, data[0]))
  })
})

// =======================
// UPDATE PRODUCT
// =======================
router.put(
  '/:id',
  authorizeUser,
  upload.single('ProductImage'),
  (req, res) => {
    if (req.user.role !== 'WHOLESALER')
      return res.send(result.createResult('Access denied'))

    const { ProductName, Category, Price, StockQuantity, Description } = req.body

    if (!ProductName || !Price)
      return res.send(result.createResult('Missing required fields'))

    const findWholesalerSql =
      `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

    pool.query(findWholesalerSql, [req.user.userId], (err, rows) => {
      if (err) return res.send(result.createResult(err))
      if (rows.length === 0)
        return res.send(result.createResult('Wholesaler profile not found'))

      let imageSql = ''
      let imageValues = []

      if (req.file) {
        imageSql = ', ProductImage = ?'
        imageValues.push(req.file.path) // ✅ Cloudinary URL
      }

      const sql = `
        UPDATE product
        SET ProductName = ?, Category = ?, Price = ?, StockQuantity = ?, Description = ?
        ${imageSql}
        WHERE ProductID = ? AND WholesalerID = ?
      `

      const params = [
        ProductName,
        Category || null,
        Price,
        StockQuantity || 0,
        Description || null,
        ...imageValues,
        req.params.id,
        rows[0].WholesalerID
      ]

      pool.query(sql, params, (err, data) => {
        if (!err && data.affectedRows === 0)
          return res.send(result.createResult('Product not found or unauthorized'))

        res.send(result.createResult(null, 'Product updated successfully'))
      })
    })
  }
)

// =======================
// DELETE PRODUCT (SOFT DELETE)
// =======================
router.delete('/:id', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const findWholesalerSql =
    `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

  pool.query(findWholesalerSql, [req.user.userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))
    if (rows.length === 0)
      return res.send(result.createResult('Wholesaler profile not found'))

    const sql = `
      UPDATE product
      SET IsActive = 0
      WHERE ProductID = ? AND WholesalerID = ?
    `

    pool.query(sql, [req.params.id, rows[0].WholesalerID], (err, data) => {
      if (!err && data.affectedRows === 0)
        return res.send(result.createResult('Product not found or unauthorized'))

      res.send(result.createResult(null, 'Product deleted successfully'))
    })
  })
})

// =======================
// GET PRODUCTS BY WHOLESALER (RETAILER)
// =======================
router.get('/wholesaler/:id', authorizeUser, (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const sql = `
    SELECT ProductID, ProductName, Category, Price, StockQuantity,
           ProductImage, WholesalerID
    FROM product
    WHERE WholesalerID = ? AND IsActive = 1
  `

  pool.query(sql, [req.params.id], (err, data) =>
    res.send(result.createResult(err, data))
  )
})

module.exports = router