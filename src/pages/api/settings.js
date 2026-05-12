// src/pages/api/settings.js
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('store_settings')
      .select('value')
      .eq('key', 'fulfillment_mode')
      .single()

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ message: error.message })
    }

    return res.status(200).json({ value: data?.value ?? 'pickup' })
  }

  if (req.method === 'PATCH') {
    const { value } = req.body

    const allowed = ['pickup', 'delivery', 'both']
    if (!allowed.includes(value)) {
      return res.status(400).json({ message: `Invalid value. Must be one of: ${allowed.join(', ')}` })
    }

    const { error } = await supabaseAdmin
      .from('store_settings')
      .update({ value })
      .eq('key', 'fulfillment_mode')

    if (error) return res.status(500).json({ message: error.message })

    return res.status(200).json({ value })
  }

  res.setHeader('Allow', ['GET', 'PATCH'])
  res.status(405).json({ message: `Method ${req.method} not allowed` })
}