const { getCustomThresholds, saveCustomThresholds } = require('../lowStockChecker');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const thresholds = await getCustomThresholds();
      res.status(200).json(thresholds);
    } catch (error) {
      console.error('Error getting custom thresholds:', error);
      res.status(500).json({ error: 'Failed to get custom thresholds' });
    }
  } else if (req.method === 'POST') {
    try {
      console.log('Saving custom thresholds:', req.body);
      const success = await saveCustomThresholds(req.body);
      console.log('Custom thresholds saved:', success);
      res.status(200).json({ success: true, message: 'Custom thresholds saved successfully' });
    } catch (error) {
      console.error('Error saving custom thresholds:', error);
      res.status(500).json({ success: false, error: 'Failed to save custom thresholds' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}