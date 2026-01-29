const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')
const authorizeUser = require('../utils/authuser')

const upload = require('../utils/upload')              // multer (memory)
const uploadImage = require('../utils/supabaseUpload') // supabase uploader

const router = express.Router()

// =======================
// ADD PRODUCT (WHOLESALER)
// =======================
router.post(
  '/',
  authorizeUser,
  upload.single('ProductImage'),
  async (req, res) => {
    try {
      if (req.user.role !== 'WHOLESALER')
        return res.send(result.createResult('Access denied'))

      const { ProductName, Category, Price, StockQuantity, Description } = req.body

      if (!ProductName || !Price)
        return res.send(result.createResult('Missing required fields'))

      const [rows] = await pool.promise().query(
        `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`,
        [req.user.userId]
      )

      if (rows.length === 0)
        return res.send(result.createResult('Wholesaler profile not found'))

      let imageUrl = null
      if (req.file) {
        imageUrl = await uploadImage(req.file)
      }

      await pool.promise().query(
        `
        INSERT INTO product
        (ProductName, Category, Price, StockQuantity, WholesalerID, ProductImage, Description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          ProductName,
          Category || null,
          Price,
          StockQuantity || 0,
          rows[0].WholesalerID,
          imageUrl,
          Description || null
        ]
      )

      res.send(result.createResult(null, 'Product added successfully'))
    } catch (err) {
      console.error('ADD PRODUCT ERROR:', err)
      res.status(500).send(result.createResult('Failed to add product'))
    }
  }
)

// =======================
// GET MY PRODUCTS (WHOLESALER)
// =======================
router.get('/products/my-products', authorizeUser, async (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const [data] = await pool.promise().query(
    `
    SELECT p.*
    FROM product p
    JOIN wholesaler w ON p.WholesalerID = w.WholesalerID
    WHERE w.UserID = ? AND p.IsActive = 1
    ORDER BY p.ProductID DESC
    `,
    [req.user.userId]
  )

  res.send(result.createResult(null, data))
})

// =======================
// GET ALL PRODUCTS (PUBLIC)
// =======================
router.get('/all', async (req, res) => {
  const [data] = await pool.promise().query(
    `SELECT * FROM product WHERE IsActive = 1`
  )
  res.send(result.createResult(null, data))
})

// =======================
// SEARCH PRODUCT BY NAME
// =======================
router.get('/search/:name', async (req, res) => {
  const [data] = await pool.promise().query(
    `SELECT * FROM product WHERE ProductName LIKE ? AND IsActive = 1`,
    [`%${req.params.name}%`]
  )
  res.send(result.createResult(null, data))
})

// =======================
// GET PRODUCTS BY CATEGORY
// =======================
router.get('/category/:category', async (req, res) => {
  const [data] = await pool.promise().query(
    `SELECT * FROM product WHERE Category = ? AND IsActive = 1`,
    [req.params.category]
  )
  res.send(result.createResult(null, data))
})

// =======================
// GET PRODUCT BY ID
// =======================
router.get('/:id', async (req, res) => {
  const [data] = await pool.promise().query(
    `SELECT * FROM product WHERE ProductID = ? AND IsActive = 1`,
    [req.params.id]
  )

  if (data.length === 0)
    return res.send(result.createResult('Product not found'))

  res.send(result.createResult(null, data[0]))
})

// =======================
// UPDATE PRODUCT (WHOLESALER)
// =======================
router.put(
  '/:id',
  authorizeUser,
  upload.single('ProductImage'),
  async (req, res) => {
    try {
      if (req.user.role !== 'WHOLESALER')
        return res.send(result.createResult('Access denied'))

      const { ProductName, Category, Price, StockQuantity, Description } = req.body

      if (!ProductName || !Price)
        return res.send(result.createResult('Missing required fields'))

      const [rows] = await pool.promise().query(
        `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`,
        [req.user.userId]
      )

      if (rows.length === 0)
        return res.send(result.createResult('Wholesaler profile not found'))

      let imageSql = ''
      let params = [
        ProductName,
        Category || null,
        Price,
        StockQuantity || 0,
        Description || null
      ]

      if (req.file) {
        const imageUrl = await uploadImage(req.file)
        imageSql = ', ProductImage = ?'
        params.push(imageUrl)
      }

      params.push(req.params.id, rows[0].WholesalerID)

      const [data] = await pool.promise().query(
        `
        UPDATE product
        SET ProductName=?, Category=?, Price=?, StockQuantity=?, Description=?
        ${imageSql}
        WHERE ProductID=? AND WholesalerID=?
        `,
        params
      )

      if (data.affectedRows === 0)
        return res.send(result.createResult('Product not found or unauthorized'))

      res.send(result.createResult(null, 'Product updated successfully'))
    } catch (err) {
      console.error('UPDATE PRODUCT ERROR:', err)
      res.status(500).send(result.createResult('Failed to update product'))
    }
  }
)

// =======================
// DELETE PRODUCT (SOFT DELETE)
// =======================
router.delete('/:id', authorizeUser, async (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const [rows] = await pool.promise().query(
    `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`,
    [req.user.userId]
  )

  if (rows.length === 0)
    return res.send(result.createResult('Wholesaler profile not found'))

  const [data] = await pool.promise().query(
    `UPDATE product SET IsActive = 0 WHERE ProductID = ? AND WholesalerID = ?`,
    [req.params.id, rows[0].WholesalerID]
  )

  if (data.affectedRows === 0)
    return res.send(result.createResult('Product not found or unauthorized'))

  res.send(result.createResult(null, 'Product deleted successfully'))
})

// =======================
// GET PRODUCTS BY WHOLESALER (RETAILER)
// =======================
router.get('/wholesaler/:id', authorizeUser, async (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const [data] = await pool.promise().query(
    `
    SELECT ProductID, ProductName, Category, Price, StockQuantity, ProductImage
    FROM product
    WHERE WholesalerID = ? AND IsActive = 1
    `,
    [req.params.id]
  )

  res.send(result.createResult(null, data))
})

module.exports = router