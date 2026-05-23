import { IncomingForm } from 'formidable'
import fs from 'fs'
import cloudinary from '../../../lib/cloudinary'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' })

  const admin = await getAdminFromCookie(req)
  if (!admin || !['superadmin', 'admin'].includes(admin.role)) {
    return res.status(403).json({ message: 'Not authorized.' })
  }

  const form = new IncomingForm({ keepExtensions: true })

  form.parse(req, async (err, _fields, files) => {
    if (err) {
      console.error('[upload parse error]', err)
      return res.status(500).json({ message: 'Failed to parse file.' })
    }

    const fileEntry = files.file?.[0] ?? files.file
    if (!fileEntry) return res.status(400).json({ message: 'No file received.' })

    try {
      const result = await cloudinary.uploader.upload(fileEntry.filepath, {
        folder: 'mini-mart/products',
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
        resource_type: 'image',
      })

      fs.unlink(fileEntry.filepath, () => {})
      return res.status(200).json({ url: result.secure_url })
    } catch (uploadErr) {
      console.error('[cloudinary upload error]', uploadErr)
      return res.status(500).json({ message: 'Failed to upload image to Cloudinary.' })
    }
  })
}