const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function deleteImage(imageUrl) {
  if (!imageUrl) return

  const path = imageUrl.split('/quickbazzar/')[1]

  if (!path) return

  await supabase.storage
    .from('quickbazzar')
    .remove([path])
}

module.exports = deleteImage