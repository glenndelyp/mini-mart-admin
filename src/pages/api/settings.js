import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {

  // ✅ Check env vars are loading
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('[settings] SUPABASE_URL:', url ? '✅ loaded' : '❌ MISSING')
  console.log('[settings] SERVICE_ROLE_KEY:', key ? '✅ loaded' : '❌ MISSING')

  if (!url || !key) {
    return res.status(500).json({ message: 'Missing Supabase environment variables.' })
  }

  const supabaseAdmin = createClient(url, key)

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('store_settings')
      .select('value')
      .eq('key', 'fulfillment_mode')
      .single()

    console.log('[settings GET] data:', data)
    console.log('[settings GET] error:', error)

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ message: error.message })
    }

    return res.status(200).json({ value: data?.value ?? 'pickup' })
  }

  if (req.method === 'PATCH') {
    const { value } = req.body

    console.log('[settings PATCH] value received:', value)

    const allowed = ['pickup', 'delivery', 'both']
    if (!allowed.includes(value)) {
      return res.status(400).json({ message: `Invalid value. Must be one of: ${allowed.join(', ')}` })
    }

    const { data, error } = await supabaseAdmin
      .from('store_settings')
      .upsert(
        { key: 'fulfillment_mode', value },
        { onConflict: 'key' }
      )

    console.log('[settings PATCH] data:', data)
    console.log('[settings PATCH] error:', error)

    if (error) return res.status(500).json({ message: error.message })

    return res.status(200).json({ value })
  }

  res.setHeader('Allow', ['GET', 'PATCH'])
  res.status(405).json({ message: `Method ${req.method} not allowed` })
}