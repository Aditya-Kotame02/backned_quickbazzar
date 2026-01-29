const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function uploadImage(file) {
  const ext = path.extname(file.originalname)
  const fileName = `products/${uuidv4()}${ext}`

  const { error } = await supabase.storage
    .from('quickbazzar')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    })

  if (error) throw error

  const { data } = supabase.storage
    .from('quickbazzar')
    .getPublicUrl(fileName)

  return data.publicUrl
}

module.exports = uploadImage