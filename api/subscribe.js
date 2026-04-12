import { Resend } from 'resend';
import admin from 'firebase-admin';

// Inisialisasi Firebase Admin dengan cara yang lebih aman
if (!admin.apps.length) {
  try {
    // Coba parse dari environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error.message);
    // Fallback untuk development (opsional)
    if (process.env.NODE_ENV === 'development') {
      console.log('Running in development mode without Firebase');
    }
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);
const db = admin.apps.length ? admin.firestore() : null;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

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
    // Untuk testing, skip dulu simpan ke Firestore
    // Kirim email aja tanpa simpan ke database
    console.log(`Mengirim email ke: ${email}`);

    const { data, error } = await resend.emails.send({
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
              Kamu akan mendapatkan notifikasi setiap kali ada quote baru.
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
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Email terkirim:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'Subscribe berhasil! Cek email kamu untuk konfirmasi.' 
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}