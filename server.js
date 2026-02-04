import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import TelegramBot from 'node-telegram-bot-api';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7967661979:AAGlUE1mJPL_tF0gHbY1wl2-wlYW0O69Ao8';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://anzhelika-guesthouse-production.up.railway.app';

// Use webhooks instead of polling (production-ready)
const bot = TELEGRAM_BOT_TOKEN ? new TelegramBot(TELEGRAM_BOT_TOKEN) : null;

// Admin chat IDs for notifications
const ADMIN_CHAT_IDS = ['878338264', '1091714465', '1032465864'];

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
    // Create table if not exists
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

    // Add missing columns if they don't exist (migration)
    try {
      await pool.query(`
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS contact_source TEXT,
        ADD COLUMN IF NOT EXISTS notification_24h_sent BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS notification_2h_sent BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Database migration completed');
    } catch (migrationError) {
      console.log('⚠️  Migration skipped (columns might already exist)');
    }

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
      contactSource: row.contact_source,
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
        prepayment, status, comment, contact_channel, contact_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
      booking.contactChannel || null,
      booking.contactSource || null
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
        contact_channel = $18,
        contact_source = $19
      WHERE id = $20
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
      booking.contactSource || null,
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

// Telegram webhook endpoint
app.post('/api/telegram-webhook', (req, res) => {
  if (bot) {
    bot.processUpdate(req.body);
  }
  res.sendStatus(200);
});

// Handle SPA routing - return index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Telegram Bot Commands
if (bot) {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log(`✅ Received /start from chat ID: ${chatId}`);

    const isRegistered = ADMIN_CHAT_IDS.includes(String(chatId));
    if (isRegistered) {
      bot.sendMessage(chatId, '✅ Бот активирован!\n\nВы будете получать уведомления о заселениях:\n• За 24 часа до заселения\n• За 2 часа до заселения');
    } else {
      bot.sendMessage(chatId, '⚠️ Ваш chat ID не зарегистрирован.\n\nВаш ID: ' + chatId + '\n\nОбратитесь к администратору для добавления.');
    }
  });
}

// Room names mapping
const ROOM_NAMES = {
  '1': 'Студия',
  '2': 'Двухкомнатный Море',
  '3': 'Двухкомнатная Студия'
};

// Check for upcoming check-ins and send notifications
async function checkUpcomingCheckIns() {
  if (!bot || ADMIN_CHAT_IDS.length === 0) return;

  try {
    const now = new Date();
    const result = await pool.query(`
      SELECT * FROM bookings
      WHERE status IN ('confirmed', 'prepaid')
      AND check_in > NOW()
      ORDER BY check_in ASC
    `);

    for (const row of result.rows) {
      const checkInTime = new Date(row.check_in);
      const hoursUntilCheckIn = (checkInTime - now) / (1000 * 60 * 60);

      // 24 hour notification
      if (hoursUntilCheckIn <= 24 && hoursUntilCheckIn > 23 && !row.notification_24h_sent) {
        await sendCheckInNotification(row, '24 часа');
        await pool.query('UPDATE bookings SET notification_24h_sent = TRUE WHERE id = $1', [row.id]);
      }

      // 2 hour notification
      if (hoursUntilCheckIn <= 2 && hoursUntilCheckIn > 1 && !row.notification_2h_sent) {
        await sendCheckInNotification(row, '2 часа');
        await pool.query('UPDATE bookings SET notification_2h_sent = TRUE WHERE id = $1', [row.id]);
      }
    }
  } catch (error) {
    console.error('Error checking upcoming check-ins:', error);
  }
}

// Send check-in notification
async function sendCheckInNotification(booking, timeframe) {
  if (!bot || ADMIN_CHAT_IDS.length === 0) return;

  const roomName = ROOM_NAMES[booking.room_id] || 'Номер ' + booking.room_id;
  const checkInDate = new Date(booking.check_in);
  const dateStr = checkInDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  let specialRequirements = [];
  if (booking.parking) specialRequirements.push('🚗 Парковка');
  if (booking.early_check_in) specialRequirements.push(`⏰ Ранний заезд (${booking.early_check_in_time})`);
  if (booking.late_check_out) specialRequirements.push(`⏰ Поздний выезд (${booking.late_check_out_time})`);

  const specialReqText = specialRequirements.length > 0
    ? '\n\n📋 Особые требования:\n' + specialRequirements.join('\n')
    : '';

  const remaining = booking.total_price - booking.prepayment;
  const paymentText = remaining > 0
    ? `\n💰 Осталось оплатить: ${remaining.toLocaleString('ru-RU')} ₽`
    : '\n✅ Полностью оплачено';

  const message = `
🔔 Напоминание о заселении через ${timeframe}!

👤 Гость: ${booking.guest_name}
📞 Телефон: ${booking.guest_phone}
🏠 Номер: ${roomName}
📅 Заселение: ${dateStr}
👥 Гости: ${booking.adults} взрослых${booking.kids > 0 ? `, ${booking.kids} детей` : ''}${paymentText}${specialReqText}${booking.comment ? '\n\n💬 Комментарий: ' + booking.comment : ''}
  `.trim();

  // Send to all admin chat IDs
  for (const chatId of ADMIN_CHAT_IDS) {
    try {
      await bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [[
            { text: '📞 Позвонить', url: `tel:${booking.guest_phone}` }
          ]]
        }
      });
      console.log(`✅ Notification sent to ${chatId} for booking ${booking.id} (${timeframe})`);
    } catch (error) {
      console.error(`Error sending notification to ${chatId}:`, error);
    }
  }
}

// Start notification checker (every 5 minutes for faster response)
if (bot && process.env.DATABASE_URL) {
  setInterval(checkUpcomingCheckIns, 5 * 60 * 1000); // Every 5 minutes
  // Also check immediately on startup
  setTimeout(checkUpcomingCheckIns, 5000); // After 5 seconds
}

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

  // Set up Telegram webhook
  if (bot && TELEGRAM_BOT_TOKEN) {
    try {
      const webhookUrl = `${WEBHOOK_URL}/api/telegram-webhook`;
      await bot.setWebHook(webhookUrl);
      console.log(`✅ Telegram webhook set to: ${webhookUrl}`);
    } catch (error) {
      console.error('❌ Failed to set Telegram webhook:', error.message);
    }
  }
});
