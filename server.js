// Set timezone to Moscow before anything else
process.env.TZ = 'Europe/Moscow';

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import fs from 'fs';
import zlib from 'zlib';
import { exec } from 'child_process';
import { promisify } from 'util';

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

// Set database timezone to Moscow
pool.on('connect', (client) => {
  client.query('SET timezone = "Europe/Moscow"');
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
  // Respond immediately to avoid timeout
  res.sendStatus(200);

  // Process update asynchronously without blocking
  if (bot) {
    setImmediate(() => {
      try {
        bot.processUpdate(req.body);
      } catch (error) {
        console.error('Error processing Telegram update:', error);
      }
    });
  }
});

// Handle SPA routing - return index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Telegram Bot Commands
if (bot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    console.log(`✅ Received /start from chat ID: ${chatId}`);

    try {
      // Set menu button for this specific user
      await bot.setChatMenuButton({
        chat_id: chatId,
        menu_button: {
          type: 'web_app',
          text: '🏠 Гостевой дом',
          web_app: {
            url: WEBHOOK_URL
          }
        }
      });
      console.log(`✅ Menu button set for chat ${chatId}`);

      const isRegistered = ADMIN_CHAT_IDS.includes(String(chatId));

      // Inline keyboard with web app button (in message)
      const inlineKeyboard = {
        inline_keyboard: [[
          { text: '🏠 Открыть Гостевой дом', web_app: { url: WEBHOOK_URL } }
        ]]
      };

      // Reply keyboard (persistent at bottom)
      const replyKeyboard = {
        keyboard: [[
          { text: '🏠 Гостевой дом', web_app: { url: WEBHOOK_URL } }
        ]],
        resize_keyboard: true,
        persistent: true
      };

      if (isRegistered) {
        await bot.sendMessage(chatId, '✅ Бот активирован!\n\nВы будете получать уведомления о заселениях:\n• За 24 часа до заселения\n• За 2 часа до заселения', {
          reply_markup: inlineKeyboard
        });
        // Set persistent keyboard
        await bot.sendMessage(chatId, '👇 Используйте кнопку внизу для быстрого доступа', {
          reply_markup: replyKeyboard
        });
      } else {
        await bot.sendMessage(chatId, '⚠️ Ваш chat ID не зарегистрирован.\n\nВаш ID: ' + chatId + '\n\nОбратитесь к администратору для добавления.');
      }
    } catch (error) {
      console.error(`Error sending /start message to ${chatId}:`, error.message);
    }
  });

  // Manual backup command
  bot.onText(/\/backup/, async (msg) => {
    const chatId = msg.chat.id;
    console.log(`✅ Received /backup from chat ID: ${chatId}`);

    try {
      const isRegistered = ADMIN_CHAT_IDS.includes(String(chatId));
      if (!isRegistered) {
        await bot.sendMessage(chatId, '⚠️ У вас нет доступа к этой команде.');
        return;
      }

      await bot.sendMessage(chatId, '📦 Создаю бекап базы данных...');
      await createAndSendBackup();
    } catch (error) {
      console.error(`Error in /backup command for ${chatId}:`, error.message);
      await bot.sendMessage(chatId, '❌ Ошибка при создании бекапа. Проверьте логи.');
    }
  });
}

// Room names mapping
const ROOM_NAMES = {
  '1': 'Студия',
  '2': 'Двухкомнатный Море',
  '3': 'Двухкомнатный Стандарт'
};

// Check for upcoming check-ins and send notifications
async function checkUpcomingCheckIns() {
  if (!bot || ADMIN_CHAT_IDS.length === 0) {
    console.log('⚠️  Notification check skipped: bot or admin IDs not configured');
    return;
  }

  try {
    const now = new Date();
    console.log(`🔍 Checking for upcoming check-ins at ${now.toLocaleString('ru-RU')}`);

    const result = await pool.query(`
      SELECT * FROM bookings
      WHERE status IN ('confirmed', 'prepaid')
      AND check_in > NOW()
      ORDER BY check_in ASC
    `);

    console.log(`📋 Found ${result.rows.length} upcoming bookings`);

    for (const row of result.rows) {
      // Use early check-in time if specified, otherwise use standard check-in time
      let checkInTime = new Date(row.check_in);

      if (row.early_check_in && row.early_check_in_time) {
        // Replace time with early check-in time
        const [hours, minutes] = row.early_check_in_time.split(':');
        checkInTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        console.log(`  ⏰ Booking ${row.id} has early check-in at ${row.early_check_in_time}`);
      }

      const hoursUntilCheckIn = (checkInTime - now) / (1000 * 60 * 60);
      console.log(`  📅 Booking ${row.id} (${row.guest_name}): ${hoursUntilCheckIn.toFixed(2)} hours until check-in`);
      console.log(`     Current time: ${now.toLocaleString('ru-RU')}, Check-in time: ${checkInTime.toLocaleString('ru-RU')}`);
      console.log(`     24h sent: ${row.notification_24h_sent}, 2h sent: ${row.notification_2h_sent}`);

      // 24 hour notification
      if (hoursUntilCheckIn <= 24 && hoursUntilCheckIn > 23 && !row.notification_24h_sent) {
        console.log(`  🔔 Sending 24h notification for booking ${row.id}`);
        await sendCheckInNotification(row, '24 часа');
        await pool.query('UPDATE bookings SET notification_24h_sent = TRUE WHERE id = $1', [row.id]);
      }

      // 2 hour notification
      if (hoursUntilCheckIn <= 2 && hoursUntilCheckIn > 1 && !row.notification_2h_sent) {
        console.log(`  🔔 Sending 2h notification for booking ${row.id}`);
        await sendCheckInNotification(row, '2 часа');
        await pool.query('UPDATE bookings SET notification_2h_sent = TRUE WHERE id = $1', [row.id]);
      }
    }

    console.log('✅ Check completed');
  } catch (error) {
    console.error('❌ Error checking upcoming check-ins:', error);
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

  // Send to all admin chat IDs in parallel with timeout
  const sendPromises = ADMIN_CHAT_IDS.map(async (chatId) => {
    try {
      await Promise.race([
        bot.sendMessage(chatId, message, {
          reply_markup: {
            inline_keyboard: [[
              { text: '👁 Открыть бронь', web_app: { url: `${WEBHOOK_URL}/?booking=${booking.id}` } }
            ]]
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      console.log(`✅ Notification sent to ${chatId} for booking ${booking.id} (${timeframe})`);
      return { chatId, success: true };
    } catch (error) {
      console.error(`❌ Error sending notification to ${chatId}:`, error.message);
      return { chatId, success: false, error: error.message };
    }
  });

  await Promise.allSettled(sendPromises);
}

// Create database backup and send to Telegram
async function createAndSendBackup() {
  if (!bot || ADMIN_CHAT_IDS.length === 0) {
    console.log('⚠️  Backup skipped: bot or admin IDs not configured');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0]; // 2026-02-05
  const backupFile = `/tmp/backup-${timestamp}.sql`;
  const gzipFile = `${backupFile}.gz`;

  try {
    console.log('📦 Creating database backup...');

    // Create pg_dump
    const execAsync = promisify(exec);
    await execAsync(`pg_dump "${process.env.DATABASE_URL}" > ${backupFile}`);

    // Compress with gzip
    const readStream = fs.createReadStream(backupFile);
    const writeStream = fs.createWriteStream(gzipFile);
    const gzip = zlib.createGzip();

    await new Promise((resolve, reject) => {
      readStream.pipe(gzip).pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    // Get file stats
    const stats = fs.statSync(gzipFile);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    // Get bookings count
    const result = await pool.query('SELECT COUNT(*) FROM bookings');
    const bookingsCount = result.rows[0].count;

    const message = `💾 Бекап базы данных
📅 ${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
📦 Размер: ${fileSizeKB} KB
📋 Бронирований: ${bookingsCount}`.trim();

    // Send to all admins
    for (const chatId of ADMIN_CHAT_IDS) {
      try {
        await bot.sendDocument(chatId, gzipFile, {
          caption: message
        });
        console.log(`✅ Backup sent to ${chatId}`);
      } catch (error) {
        console.error(`❌ Error sending backup to ${chatId}:`, error.message);
      }
    }

    // Cleanup
    fs.unlinkSync(backupFile);
    fs.unlinkSync(gzipFile);

    console.log('✅ Backup completed and sent');
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    // Cleanup on error
    try {
      if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
      if (fs.existsSync(gzipFile)) fs.unlinkSync(gzipFile);
    } catch { }
  }
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

      // Set up menu button to open Mini App
      await bot.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: '🏠 Гостевой дом',
          web_app: {
            url: WEBHOOK_URL
          }
        }
      });
      console.log(`✅ Telegram menu button set: "🏠 Гостевой дом"`);
    } catch (error) {
      console.error('❌ Failed to set Telegram webhook:', error.message);
    }
  }

  // Start notification checker (every hour)
  if (bot && process.env.DATABASE_URL) {
    console.log('🔔 Starting notification checker...');
    setInterval(checkUpcomingCheckIns, 60 * 60 * 1000); // Every hour
    // Also check immediately on startup
    setTimeout(checkUpcomingCheckIns, 5000); // After 5 seconds
    console.log('✅ Notification checker started (checks every hour)');
  }

  // Start backup scheduler (every day at 3:00 AM Moscow time)
  if (bot && process.env.DATABASE_URL) {
    console.log('💾 Starting backup scheduler...');
    cron.schedule('0 3 * * *', createAndSendBackup, {
      timezone: 'Europe/Moscow'
    });
    console.log('✅ Backup scheduler started (runs daily at 3:00 AM Moscow time)');
  }
});
