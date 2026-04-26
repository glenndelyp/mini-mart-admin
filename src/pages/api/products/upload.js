// src/pages/api/products/upload.js
// Receives a base64-encoded image from the client,
// uploads it to Cloudinary, and returns the secure URL.

import { IncomingForm } from 'formidable'
import fs               from 'fs'
import cloudinary       from '../../lib/cloudinary'

// Tell Next.js NOT to parse the body — formidable handles it
export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' })

  const form = new IncomingForm({ keepExtensions: true })

  form.parse(req, async (err, _fields, files) => {
    if (err) {
      console.error('[upload parse error]', err)
      return res.status(500).json({ message: 'Failed to parse file.' })
    }

    // formidable v3 wraps each file in an array
    const fileEntry = files.file?.[0] ?? files.file
    if (!fileEntry) return res.status(400).json({ message: 'No file received.' })

    try {
      const result = await cloudinary.uploader.upload(fileEntry.filepath, {
        // ── Cloudinary folder ──────────────────────────────────────────────
        // All product images will be stored under this folder in Cloudinary.
        // Change 'mini-mart/products' to any folder path you prefer.
        // ──────────────────────────────────────────────────────────────────
        folder: 'mini-mart/products',

        // ── Image size / quality on upload ────────────────────────────────
        // Cloudinary will resize & compress the image on their end.
        // Change the values below to control the stored image dimensions:
        //   transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
        //   - width / height : max dimensions (won't upscale, only downscale)
        //   - crop: 'limit'  : keeps aspect ratio, fits within the box
        //   - quality: 'auto': Cloudinary picks the best quality/size balance
        // To store the original without any resizing, remove the transformation line entirely.
        // ──────────────────────────────────────────────────────────────────
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],

        resource_type: 'image',
      })

      // Clean up the temp file formidable wrote to disk
      fs.unlink(fileEntry.filepath, () => {})

      return res.status(200).json({ url: result.secure_url })
    } catch (uploadErr) {
      console.error('[cloudinary upload error]', uploadErr)
      return res.status(500).json({ message: 'Failed to upload image to Cloudinary.' })
    }
  })
}