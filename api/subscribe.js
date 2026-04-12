import { Resend } from 'resend';
import admin from 'firebase-admin';

// Inisialisasi Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const resend = new Resend(process.env.RESEND_API_KEY);
const db = admin.firestore();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email tidak valid' });
  }

  try {
    // Cek apakah email sudah terdaftar
    const subscribersRef = db.collection('subscribers');
    const existing = await subscribersRef.where('email', '==', email).get();
    
    if (!existing.empty) {
      return res.status(400).json({ error: 'Email sudah terdaftar!' });
    }

    // Simpan subscriber ke Firestore
    await subscribersRef.add({
      email: email,
      subscribedAt: new Date(),
      verified: true,
    });

    // Kirim email konfirmasi
    await resend.emails.send({
      from: 'quotesKu <onboarding@resend.dev>',
      to: email,
      subject: 'Selamat Datang di quotesKu! ✨',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1e3a5f 0%, #355485 100%); border-radius: 20px;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: white; margin: 0;">✨ quotesKu ✨</h1>
            <p style="color: #cbdde9;">Temukan inspirasi dalam setiap kata</p>
          </div>
          <div style="background: white; border-radius: 15px; padding: 30px; margin-top: 20px;">
            <h2 style="color: #1e3a5f; margin-top: 0;">Halo! 👋</h2>
            <p style="color: #4a5568; line-height: 1.6;">
              Terima kasih telah berlangganan notifikasi quotesKu!
            </p>
            <p style="color: #4a5568; line-height: 1.6;">
              Kamu akan mendapatkan notifikasi setiap kali ada quote baru dari penulis favoritmu.
            </p>
            <div style="background: #f0f4f8; border-radius: 10px; padding: 15px; margin: 20px 0;">
              <p style="color: #1e3a5f; margin: 0; font-size: 14px;">
                📧 <strong>${email}</strong>
              </p>
            </div>
            <p style="color: #4a5568; font-size: 14px; margin-top: 20px;">
              Salam inspirasi,<br>
              <strong>Tim quotesKu</strong>
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #cbdde9; font-size: 12px;">
            <p>© 2024 quotesKu • Temukan inspirasi setiap hari</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Subscribe berhasil! Cek email kamu untuk konfirmasi.' 
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Gagal mendaftarkan email' });
  }
}