import { Resend } from 'resend';
import admin from 'firebase-admin';

// Inisialisasi Firebase Admin (gunakan service account)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const resend = new Resend(process.env.RESEND_API_KEY);
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { quoteId, author, text } = req.body;

  try {
    // Ambil semua subscriber
    const subscribersSnapshot = await db.collection('subscribers').get();
    const subscribers = subscribersSnapshot.docs.map(doc => doc.data().email);

    if (subscribers.length === 0) {
      return res.status(200).json({ message: 'Tidak ada subscriber' });
    }

    // Kirim email ke semua subscriber (batch)
    const emailPromises = subscribers.map(email => 
      resend.emails.send({
        from: 'quotesKu <notifikasi@resend.dev>',
        to: email,
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
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; text-align: center;">
                  Kamu menerima email ini karena berlangganan notifikasi quotesKu.<br>
                  <a href="https://quoteskuu.vercel.app/unsubscribe?email=${email}" style="color: #4f90c6;">Berhenti berlangganan</a>
                </p>
              </div>
            </div>
          </div>
        `,
      })
    );

    await Promise.all(emailPromises);

    return res.status(200).json({ 
      success: true, 
      message: `Notifikasi dikirim ke ${subscribers.length} subscriber` 
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Gagal mengirim notifikasi' });
  }
}