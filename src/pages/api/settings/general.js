import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY    
)

const KEYS = [
  'phone', 'email', 'street', 'city', 'province', 'hours',
  'storeName', 'storeType', 'currency', 'desc',
  'acceptOrders', 'showOnApp', 'lowStockAlerts', 'allowCancels',
  'fulfillment_mode'
]

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('store_settings')
      .select('key, value')
      .in('key', KEYS)

    if (error) return res.status(500).json({ message: error.message })

    const result = {}
    for (const row of data) {
      try { result[row.key] = JSON.parse(row.value) }
      catch { result[row.key] = row.value }
    }
    return res.json(result)
  }

  if (req.method === 'PATCH') {
    const updates = Object.entries(req.body).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }))

    const { error } = await supabase
      .from('store_settings')
      .upsert(updates, { onConflict: 'key' })

    if (error) {
      console.error('Supabase upsert error:', error)  // ← check your terminal
      return res.status(500).json({ message: error.message })
    }
    return res.json({ ok: true })
  }

  res.status(405).json({ message: 'Method not allowed' })
}