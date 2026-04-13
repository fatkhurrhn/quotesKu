export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const KEPLARS_API_KEY = process.env.KEPLARS_API_KEY;
    
    if (!KEPLARS_API_KEY) {
      return res.status(500).json({ error: 'KEPLARS_API_KEY not configured' });
    }

    // Perbaikan: 'to' harus berupa array, bukan string
    const response = await fetch('https://api.keplars.com/api/v1/send-email/high', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEPLARS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ig.storythur@gmail.com',
        to: ['fatkhurmeranti27@gmail.com'], // 🔥 Perbaikan: pakai array
        subject: 'Test Email from Keplars',
        html: '<p>Test email dari quotesKu menggunakan Keplars!</p>',
      }),
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);

    return res.status(200).json({ 
      success: response.ok, 
      status: response.status,
      data: data 
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}