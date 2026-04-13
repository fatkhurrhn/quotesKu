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
      body: JSON.stringify({
        from: 'ig.storythur@gmail.com',
        to: [email],
        subject: '✨ Selamat Datang di quotesKu! ✨',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #355485 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">📖 quotesKu</h1>
              <p style="color: #cbdde9; margin: 8px 0 0; font-size: 14px;">Temukan inspirasi dalam setiap kata</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 24px; background: #ffffff;">
              <h2 style="color: #1e3a5f; margin: 0 0 16px; font-size: 24px;">Halo! 👋</h2>
              <p style="color: #4a5568; line-height: 1.6; margin: 0 0 16px;">
                Terima kasih telah berlangganan notifikasi quotesKu!
              </p>
              <p style="color: #4a5568; line-height: 1.6; margin: 0 0 24px;">
                Kamu akan mendapatkan notifikasi setiap kali ada quote baru dari penulis favoritmu.
              </p>
              
              <!-- Info Box -->
              <div style="background: #f0f4f8; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">📧 Email terdaftar</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e3a5f;">${email}</p>
              </div>
              
              <!-- Button -->
              <div style="text-align: center; margin: 32px 0 24px;">
                <a href="https://quoteskuu.vercel.app/quotes" style="display: inline-block; background: linear-gradient(135deg, #1e3a5f, #355485); color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Jelajahi Quotes →
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                Salam inspirasi,<br>
                <strong>Tim quotesKu</strong>
              </p>
            </div>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Keplars error:', data);
      return res.status(500).json({ error: data.error?.message || 'Gagal mengirim email' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Subscribe berhasil! Cek email kamu.' 
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}