require('dotenv').config()

const express = require('express')
const cors = require('cors')

// routes
const authorizeUser = require('./utils/authuser')
const userRouter = require('./routes/user')
const retailerRouter = require('./routes/retailers')
const reportsRouter = require('./routes/reports')
const adminRouter = require('./routes/admin')
const paymentRouter = require('./routes/payments')
const productRouter = require('./routes/product')
const wholesalerRouter = require('./routes/wholesaler')
const orderRouter = require('./routes/order')
const orderItemRouter = require('./routes/orderItem')

const app = express()

app.use(cors({
  origin: '*'
}))
app.use(express.json())

app.use(authorizeUser)

app.use('/user', userRouter)
app.use('/retailer', retailerRouter)
app.use('/reports', reportsRouter)
app.use('/admin', adminRouter)
app.use('/payments', paymentRouter)
app.use('/product', productRouter)
app.use('/wholesaler', wholesalerRouter)
app.use('/orders', orderRouter)
app.use('/orderitem', orderItemRouter)

const PORT = process.env.PORT || 4000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`)
})