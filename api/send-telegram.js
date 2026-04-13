export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, author, quoteText } = req.body;

  // Validasi input
  if (!type || !author || !quoteText) {
    console.error('Missing required fields:', { type, author, quoteText });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Validasi environment variables
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is not configured');
      return res.status(500).json({ error: 'Telegram bot token missing' });
    }

    if (!TELEGRAM_CHAT_ID) {
      console.error('TELEGRAM_CHAT_ID is not configured');
      return res.status(500).json({ error: 'Telegram chat ID missing' });
    }

    let text = '';

    if (type === 'new_quote') {
      text = `
📢 *QUOTE BARU!* 📢

*👤 Author:* ${author}
*📝 Quote:* "${quoteText}"

🔄 *Status:* Pending (menunggu approve)

🔗 *Link:* https://quoteskuu.vercel.app/manage
      `.trim();
    } else if (type === 'approved') {
      text = `
✅ *QUOTE TELAH DIAPPROVE!* ✅

*👤 Author:* ${author}
*📝 Quote:* "${quoteText}"

📢 *Status:* Approved (telah tampil di website)

🔗 *Link:* https://quoteskuu.vercel.app/quotes
      `.trim();
    } else {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    console.log('Sending Telegram notification:', { type, author, chatId: TELEGRAM_CHAT_ID });

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', data);
      return res.status(500).json({ error: 'Telegram API error', details: data });
    }

    console.log('Telegram notification sent successfully');
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in send-telegram:', error.message);
    return res.status(500).json({ error: error.message });
  }
}