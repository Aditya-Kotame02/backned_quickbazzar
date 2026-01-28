const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const pool = require('../utils/db')
const result = require('../utils/result')
const config = require('../utils/config')

const router = express.Router()

router.post('/signup', (req, res) => {
  const { name, email, password } = req.body
  const role = 'RETAILER'

  bcrypt.hash(password, config.SALT_ROUND, (err, hash) => {
    if (err)
      return res.send(result.createResult(err))

    const sql =
      `INSERT INTO users (Name, Email, PasswordHash, Role)
       VALUES (?, ?, ?, ?)`

    pool.query(sql, [name, email, hash, role], (err, data) => {
      res.send(result.createResult(err, data))
    })
  })
})

router.post('/signin', (req, res) => {
  const { email, password } = req.body
  const sql = `SELECT * FROM users WHERE Email = ?`

  pool.query(sql, [email], (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (data.length === 0)
      return res.send(result.createResult('Invalid Email'))

    bcrypt.compare(password, data[0].PasswordHash, (err, status) => {
      if (err)
        return res.send(result.createResult(err))

      if (!status)
        return res.send(result.createResult('Invalid Password'))

      const token = jwt.sign(
        {
          userId: data[0].UserID,
          role: data[0].Role
        },
        config.SECRET,
        { expiresIn: '1d' }
      )

      res.send(result.createResult(null, {
        token,
        name: data[0].Name,
        email: data[0].Email,
        role: data[0].Role
      }))
    })
  })
})

router.post('/web/signup', (req, res) => {
  const { name, email, password, role } = req.body

  if (!['ADMIN', 'WHOLESALER', 'RETAILER'].includes(role))
    return res.send(result.createResult('Invalid role'))

  bcrypt.hash(password, config.SALT_ROUND, (err, hash) => {
    if (err)
      return res.send(result.createResult(err))

    const sql =
      `INSERT INTO users (Name, Email, PasswordHash, Role)
       VALUES (?, ?, ?, ?)`

    pool.query(sql, [name, email, hash, role], (err, data) => {
      res.send(result.createResult(err, data))
    })
  })
})

router.get('/profile', (req, res) => {
  const uid = req.user.userId

  pool.query(
    `SELECT Name, Email, Role FROM users WHERE UserID = ?`,
    [uid],
    (err, data) => {
      if (err)
        return res.send(result.createResult(err))

      if (data.length === 0)
        return res.send(result.createResult('User not found'))

      res.send(result.createResult(null, data[0]))
    }
  )
})

router.patch('/update-user', (req, res) => {
  const uid = req.user.userId
  const { email } = req.body

  const sql = `UPDATE users SET Email=? WHERE UserID=?`

  pool.query(sql, [email, uid], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

router.patch('/update-password', (req, res) => {
  const uid = req.user.userId
  const { oldPassword, newPassword } = req.body

  pool.query(
    `SELECT PasswordHash FROM users WHERE UserID=?`,
    [uid],
    (err, data) => {
      if (err)
        return res.send(result.createResult(err))

      if (data.length === 0)
        return res.send(result.createResult('User not found'))

      bcrypt.compare(oldPassword, data[0].PasswordHash, (err, status) => {
        if (err)
          return res.send(result.createResult(err))

        if (!status)
          return res.send(result.createResult('Old password incorrect'))

        bcrypt.hash(newPassword, config.SALT_ROUND, (err, hash) => {
          if (err)
            return res.send(result.createResult(err))

          const sql = `UPDATE users SET PasswordHash=? WHERE UserID=?`

          pool.query(sql, [hash, uid], (err) => {
            res.send(
              result.createResult(err, 'Password updated successfully')
            )
          })
        })
      })
    }
  )
})

module.exports = router