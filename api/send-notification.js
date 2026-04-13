export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { author, text } = req.body;

  // Daftar subscriber (nanti ambil dari Firestore)
  const subscribers = [
    'fatkhurmeranti27@gmail.com',
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
          to: [email], // 🔥 Perbaikan: pakai array
          subject: `✨ Quote baru dari ${author} di quotesKu!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1e3a5f 0%, #355485 100%); border-radius: 20px;">
              <div style="text-align: center; padding: 20px;">
                <h1 style="color: white; margin: 0;">📖 quotesKu</h1>
                <p style="color: #cbdde9;">Quote baru telah hadir!</p>
              </div>
              <div style="background: white; border-radius: 15px; padding: 30px; margin-top: 20px;">
                <div style="text-align: center;">
                  <div style="background: #f0f4f8; border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                    <p style="color: #1e3a5f; font-size: 18px; font-style: italic; margin: 0;">
                      "${text}"
                    </p>
                    <p style="color: #4a5568; margin-top: 15px; margin-bottom: 0;">
                      — <strong>${author}</strong>
                    </p>
                  </div>
                  <a href="https://quoteskuu.vercel.app/quotes" 
                     style="display: inline-block; background: linear-gradient(135deg, #1e3a5f, #355485); color: white; padding: 12px 30px; border-radius: 10px; text-decoration: none; margin-top: 10px;">
                    Lihat Quote Lainnya →
                  </a>
                </div>
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