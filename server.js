import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize database table
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        room_id VARCHAR(255) NOT NULL,
        guest_name VARCHAR(255) NOT NULL,
        guest_phone VARCHAR(50) NOT NULL,
        check_in TIMESTAMP NOT NULL,
        check_out TIMESTAMP NOT NULL,
        adults INTEGER NOT NULL,
        kids INTEGER NOT NULL DEFAULT 0,
        parking BOOLEAN DEFAULT FALSE,
        early_check_in BOOLEAN DEFAULT FALSE,
        early_check_in_time VARCHAR(10),
        late_check_out BOOLEAN DEFAULT FALSE,
        late_check_out_time VARCHAR(10),
        daily_price INTEGER NOT NULL,
        total_price INTEGER NOT NULL,
        prepayment INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'confirmed',
        comment TEXT,
        contact_channel VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Database table initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// API Routes

// GET /api/bookings - Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    const bookings = result.rows.map(row => ({
      id: row.id,
      roomId: row.room_id,
      guestName: row.guest_name,
      guestPhone: row.guest_phone,
      checkIn: row.check_in,
      checkOut: row.check_out,
      adults: row.adults,
      kids: row.kids,
      parking: row.parking,
      earlyCheckIn: row.early_check_in,
      earlyCheckInTime: row.early_check_in_time,
      lateCheckOut: row.late_check_out,
      lateCheckOutTime: row.late_check_out_time,
      dailyPrice: row.daily_price,
      totalPrice: row.total_price,
      prepayment: row.prepayment,
      status: row.status,
      comment: row.comment,
      contactChannel: row.contact_channel,
      createdAt: row.created_at
    }));
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings - Create new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = req.body;
    await pool.query(`
      INSERT INTO bookings (
        id, room_id, guest_name, guest_phone, check_in, check_out,
        adults, kids, parking, early_check_in, early_check_in_time,
        late_check_out, late_check_out_time, daily_price, total_price,
        prepayment, status, comment, contact_channel
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `, [
      booking.id,
      booking.roomId,
      booking.guestName,
      booking.guestPhone,
      booking.checkIn,
      booking.checkOut,
      booking.adults,
      booking.kids || 0,
      booking.parking || false,
      booking.earlyCheckIn || false,
      booking.earlyCheckInTime || null,
      booking.lateCheckOut || false,
      booking.lateCheckOutTime || null,
      booking.dailyPrice,
      booking.totalPrice,
      booking.prepayment || 0,
      booking.status || 'confirmed',
      booking.comment || null,
      booking.contactChannel || null
    ]);
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PUT /api/bookings/:id - Update booking
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = req.body;
    await pool.query(`
      UPDATE bookings SET
        room_id = $1,
        guest_name = $2,
        guest_phone = $3,
        check_in = $4,
        check_out = $5,
        adults = $6,
        kids = $7,
        parking = $8,
        early_check_in = $9,
        early_check_in_time = $10,
        late_check_out = $11,
        late_check_out_time = $12,
        daily_price = $13,
        total_price = $14,
        prepayment = $15,
        status = $16,
        comment = $17,
        contact_channel = $18
      WHERE id = $19
    `, [
      booking.roomId,
      booking.guestName,
      booking.guestPhone,
      booking.checkIn,
      booking.checkOut,
      booking.adults,
      booking.kids || 0,
      booking.parking || false,
      booking.earlyCheckIn || false,
      booking.earlyCheckInTime || null,
      booking.lateCheckOut || false,
      booking.lateCheckOutTime || null,
      booking.dailyPrice,
      booking.totalPrice,
      booking.prepayment || 0,
      booking.status || 'confirmed',
      booking.comment || null,
      booking.contactChannel || null,
      id
    ]);
    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// DELETE /api/bookings/:id - Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Handle SPA routing - return index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔌 Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'Not configured'}`);

  if (process.env.DATABASE_URL) {
    await initDatabase();
  } else {
    console.warn('⚠️  DATABASE_URL not set. API endpoints will not work.');
  }
});
