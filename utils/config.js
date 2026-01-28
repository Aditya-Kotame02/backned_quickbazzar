const config = {
  SALT_ROUND: parseInt(process.env.SALT_ROUND),
  SECRET: process.env.JWT_SECRET
}

module.exports = config
