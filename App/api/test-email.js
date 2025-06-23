const { saveEmailToDB } = require('../database');

export default async function handler(req, res) {
  try {
    const testEmail = {
      subject: 'Test Low Stock Alert - ' + new Date().toISOString(),
      from: 'Low Stock Alert <alerts@lowstockalert.com>',
      to: 'vampirepes24@gmail.com',
      html: '<h2>Test Email</h2><p>This is a test email to verify the inbox is working.</p>',
      read: false
    };
    
    const saved = await saveEmailToDB(testEmail);
    res.status(200).json({ success: saved, message: 'Test email inserted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}