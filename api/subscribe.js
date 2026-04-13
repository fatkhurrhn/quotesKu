export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email tidak valid' });
  }

  try {
    const KEPLARS_API_KEY = process.env.KEPLARS_API_KEY;
    
    const response = await fetch('https://api.keplars.com/api/v1/send-email/high', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEPLARS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      // Bagian body JSON-nya jadi seperti ini:
body: JSON.stringify({
  from: 'ig.storythur@gmail.com',
  to: [email],
  subject: 'Selamat Datang di quotesKu! ✨',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e3a5f 0%, #355485 100%); padding: 20px;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; padding: 30px;">
              <tr>
                <td align="center">
                  <h1 style="color: #1e3a5f;">✨ quotesKu ✨</h1>
                  <p style="color: #4a5568;">Temukan inspirasi dalam setiap kata</p>
                  <div style="background: #f0f4f8; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <h2 style="color: #1e3a5f; margin-top: 0;">Halo! 👋</h2>
                    <p style="color: #4a5568;">Terima kasih telah berlangganan notifikasi quotesKu!</p>
                    <p style="color: #4a5568;">Kamu akan mendapatkan notifikasi setiap kali ada quote baru.</p>
                    <p style="background: white; padding: 10px; border-radius: 5px;">
                      📧 <strong>${email}</strong>
                    </p>
                  </div>
                  <p style="color: #4a5568;">Salam inspirasi,<br><strong>Tim quotesKu</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
  text: `Halo! Terima kasih telah berlangganan notifikasi quotesKu! Kamu akan mendapatkan notifikasi setiap kali ada quote baru. Salam inspirasi, Tim quotesKu`,
}),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Keplars error:', data);
      return res.status(500).json({ error: data.error?.message || 'Gagal mengirim email' });
    }

    console.log('Subscribe email terkirim:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'Subscribe berhasil! Cek email kamu.' 
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}