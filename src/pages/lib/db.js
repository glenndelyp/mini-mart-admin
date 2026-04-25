// lib/db.js
// Reuses the same @neondatabase/serverless package already in your project
import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL)