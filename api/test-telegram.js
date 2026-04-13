export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Cek apakah environment variables ada
    const hasToken = !!TELEGRAM_BOT_TOKEN;
    const hasChatId = !!TELEGRAM_CHAT_ID;

    // Test kirim pesan sederhana
    let testResult = null;
    if (hasToken && hasChatId) {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: '🔧 Test dari quotesKu API',
        }),
      });
      testResult = await response.json();
    }

    return res.status(200).json({
      hasToken,
      hasChatId,
      tokenPreview: hasToken ? `${TELEGRAM_BOT_TOKEN.substring(0, 10)}...` : null,
      chatIdPreview: hasChatId ? TELEGRAM_CHAT_ID : null,
      testResult,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}