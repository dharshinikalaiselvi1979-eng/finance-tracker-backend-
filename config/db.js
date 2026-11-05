import pg from "pg";

const { Pool } = pg;

const connectionString =
  process.env.SUPABASE_URI ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  ssl:
    !connectionString ||
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);

export const connectDB = async () => {
  if (!connectionString) {
    console.warn("⚠️ No SUPABASE_URI configured in environment variables.");
    return;
  }

  try {
    const client = await pool.connect();
    console.log("Connected to Supabase PostgreSQL database");

    // Automatically create required tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        notes TEXT DEFAULT '',
        date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
    `);

    client.release();
    console.log("Supabase database tables verified and ready");
  } catch (err) {
    console.error("Supabase connection failed:", err.message);
  }
};

export default connectDB;
