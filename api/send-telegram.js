export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, author, quoteText } = req.body;

  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram credentials');
      return res.status(500).json({ error: 'Telegram not configured' });
    }

    // Format pesan
    const text = `
📢 *QUOTE BARU!* 📢

*👤 Author:* ${author}
*📝 Quote:* "${quoteText || message}"

🔄 *Status:* Pending (menunggu approve)

🔗 *Link:* https://quoteskuu.vercel.app/manage-quotes
    `.trim();

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
      return res.status(500).json({ error: 'Failed to send Telegram message' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}