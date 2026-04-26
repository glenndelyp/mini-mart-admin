// src/lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  // ─────────────────────────────────────────────────────────────────────────
  // TEMPORARY SETUP (your current free/test Cloudinary account)
  // When you're ready to switch to a permanent/production account:
  //   1. Go to cloudinary.com → log in to your PERMANENT account
  //   2. Go to Settings → API Keys
  //   3. Copy the Cloud Name, API Key, and API Secret
  //   4. Replace the three env variable values in your .env.local with the
  //      new credentials from the permanent account
  //   5. No code changes needed here — just update .env.local
  // ─────────────────────────────────────────────────────────────────────────
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   // ← change value in .env.local
  api_key:    process.env.CLOUDINARY_API_KEY,       // ← change value in .env.local
  api_secret: process.env.CLOUDINARY_API_SECRET,   // ← change value in .env.local
  secure: true,
})

export default cloudinary