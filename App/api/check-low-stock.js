const { checkLowStock, sendLowStockNotifications } = require('../lowStockChecker');
const { getNotificationSettings, sendEmailNotification } = require('../notificationService');

export default async function handler(req, res) {
  try {
    console.log('🔍 Checking for low stock items...');
    const defaultThreshold = req.query.threshold ? parseInt(req.query.threshold) : 5;
    console.log(`Using default threshold: ${defaultThreshold}`);
    
    const lowStockItems = await checkLowStock(defaultThreshold);
    console.log(`Found ${lowStockItems.length} low stock items`);
    
    if (lowStockItems.length > 0) {
      // Log each low stock item
      lowStockItems.forEach(item => {
        let totalInventory = 0;
        item.variants.forEach(variant => {
          if (variant.inventory_management === 'shopify') {
            totalInventory += variant.inventory_quantity;
          }
        });
        console.log(`🔍 Product: ${item.title}, Quantity: ${totalInventory}, Threshold: ${defaultThreshold}`);
      });
      
      await sendLowStockNotifications(lowStockItems);
      
      // Send email notification if enabled
      const settings = await getNotificationSettings();
      console.log('Notification settings:', settings);
      
      if (!settings.disableEmail) {
        console.log('📧 Email notifications are enabled, sending email to:', settings.email);
        try {
          const emailSent = await sendEmailNotification(lowStockItems, defaultThreshold);
          console.log('Email notification sent:', emailSent);
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
        }
      } else {
        console.log('Email notifications are disabled');
      }
    }
    
    res.status(200).json({ 
      message: `Found ${lowStockItems.length} items with low stock`,
      items: lowStockItems
    });
  } catch (error) {
    console.error('Error checking low stock:', error);
    res.status(500).json({ error: 'Failed to check low stock' });
  }
}