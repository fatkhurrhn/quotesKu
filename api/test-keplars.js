export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

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
        to: ['fatkhurmeranti27@gmail.com'],
        subject: 'Test Email from Keplars',
        html: '<!DOCTYPE html><html><body><h1>Halo!</h1><p>Test email dari quotesKu</p></body></html>',
        text: 'Halo! Test email dari quotesKu', // Tambahkan plain text version
      }),
    });

    const data = await response.json();
    return res.status(200).json({ success: response.ok, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}