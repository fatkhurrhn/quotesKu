export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const KEPLARS_API_KEY = process.env.KEPLARS_API_KEY;
    
    console.log('API Key exists:', !!KEPLARS_API_KEY);
    
    if (!KEPLARS_API_KEY) {
      return res.status(500).json({ error: 'KEPLARS_API_KEY not configured' });
    }

    const response = await fetch('https://api.keplars.com/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEPLARS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'quotesKu <ig.storythur@gmail.com>',
        to: 'fatkhurmeranti27@gmail.com', // Ganti dengan email kamu
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