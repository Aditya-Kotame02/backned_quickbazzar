const jwt = require('jsonwebtoken')
const result = require('./result')
const config = require('./config')

function authorizeUser(req, res, next) {

  // Public routes (safe check)
  const publicRoutes = [
    '/user/signin',
    '/user/signup',
    '/user/web/signup',
    '/product/all',
    '/orders'
  ]

  if (publicRoutes.includes(req.path)) {
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader)
    return res.send(result.createResult('Token missing'))

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, config.SECRET)

    req.user = {
      userId: payload.userId,
      role: payload.role
    }

    next()
  } catch (ex) {
    return res.send(result.createResult('Invalid Token'))
  }
}

module.exports = authorizeUser