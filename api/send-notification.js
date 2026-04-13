export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { author, text } = req.body;

  // Daftar subscriber (nanti ambil dari Firestore)
  const subscribers = [
    'fatkhurmeranti27@gmail.com',
    // tambah email lain di sini
  ];

  try {
    const KEPLARS_API_KEY = process.env.KEPLARS_API_KEY;
    
    const emailPromises = subscribers.map(async (email) => {
      const response = await fetch('https://api.keplars.com/api/v1/send-email/high', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KEPLARS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ig.storythur@gmail.com',
          to: [email],
          subject: `✨ Quote baru dari ${author} di quotesKu! ✨`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #1e3a5f 0%, #355485 100%); padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📖 quotesKu</h1>
                <p style="color: #cbdde9; margin: 8px 0 0; font-size: 13px;">Quote baru telah hadir!</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px 24px; background: #ffffff;">
                <!-- Quote Card -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #355485;">
                  <p style="color: #1e293b; font-size: 18px; font-style: italic; line-height: 1.6; margin: 0 0 16px;">
                    "${text}"
                  </p>
                  <p style="color: #475569; margin: 0; font-size: 14px;">
                    — <strong style="color: #355485;">${author}</strong>
                  </p>
                </div>
                
                <!-- Button -->
                <div style="text-align: center; margin: 24px 0;">
                  <a href="https://quoteskuu.vercel.app/quotes" style="display: inline-block; background: linear-gradient(135deg, #1e3a5f, #355485); color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Lihat Quote Lainnya →
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                  Kamu menerima email ini karena berlangganan notifikasi quotesKu.<br>
                  <a href="https://quoteskuu.vercel.app" style="color: #4f90c6; text-decoration: none;">Kunjungi website</a>
                </p>
              </div>
            </div>
          `,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(`Gagal kirim ke ${email}:`, data);
      }
      return data;
    });

    await Promise.all(emailPromises);

    return res.status(200).json({ 
      success: true, 
      message: `Notifikasi dikirim ke ${subscribers.length} subscriber` 
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Gagal mengirim notifikasi', detail: error.message });
  }
}