const { getNotificationSettings, saveNotificationSettings } = require('../notificationService');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const settings = await getNotificationSettings();
      res.status(200).json(settings);
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  } else if (req.method === 'POST') {
    try {
      console.log('Saving settings:', req.body);
      const success = await saveNotificationSettings(req.body);
      console.log('Settings saved:', success);
      res.status(200).json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ success: false, error: 'Failed to save settings' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}