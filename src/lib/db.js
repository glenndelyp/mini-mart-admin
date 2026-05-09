import postgres from 'postgres'

const globalForDb = globalThis

if (!globalForDb._sql) {
  globalForDb._sql = postgres(process.env.DATABASE_URL, {
    max: 10,                  
    idle_timeout: 30,        
    connect_timeout: 10,      
  })
}

export const sql = globalForDb._sql