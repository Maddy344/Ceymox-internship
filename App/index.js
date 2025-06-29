require('dotenv').config();
const express = require('express');
const path = require('path');
const cron = require('node-cron');
const prisma = require('./prisma-client');
const { checkLowStock, sendLowStockNotifications, getLowStockHistory, getCustomThresholds, saveCustomThresholds, getAllProducts } = require('./lowStockChecker');
const { 
  getNotificationSettings, 
  saveNotificationSettings, 
  sendEmailNotification,
  sendSummaryReport
} = require('./notificationService');
const { setupOAuthRoutes } = require('./oauth');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Setup OAuth routes
setupOAuthRoutes(app);

// Home route - serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to check for low stock items
app.get('/check-low-stock', async (req, res) => {
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
    
    res.json({ 
      message: `Found ${lowStockItems.length} items with low stock`,
      items: lowStockItems
    });
  } catch (error) {
    console.error('Error checking low stock:', error);
    res.status(500).json({ error: 'Failed to check low stock' });
  }
});



// API route to get notification settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getNotificationSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// API route to save notification settings
app.post('/api/settings', express.json(), async (req, res) => {
  try {
    console.log('Saving settings:', req.body);
    await prisma.notificationSettings.deleteMany();
    await prisma.notificationSettings.create({ data: req.body });
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error in settings API:', error);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// API route to get low stock history for reports
app.get('/api/reports/:period', async (req, res) => {
  try {
    const period = req.params.period || 'daily';
    const selectedDate = req.query.date;
    const history = await getLowStockHistory(period, selectedDate);
    res.json(history);
  } catch (error) {
    console.error('Error getting report data:', error);
    res.status(500).json({ error: 'Failed to get report data' });
  }
});

// API route to generate and send a report
app.post('/api/reports/:period/send', async (req, res) => {
  try {
    const period = req.params.period || 'daily';
    const history = await getLowStockHistory(period);
    const success = await sendSummaryReport(period, history);
    
    if (success) {
      res.json({ success: true, message: `${period} report sent successfully` });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send report' });
    }
  } catch (error) {
    console.error('Error sending report:', error);
    res.status(500).json({ success: false, error: 'Failed to send report' });
  }
});

// API route to get custom thresholds
app.get('/api/custom-thresholds', async (req, res) => {
  try {
    const thresholds = await getCustomThresholds();
    res.json(thresholds);
  } catch (error) {
    console.error('Error getting custom thresholds:', error);
    res.status(500).json({ error: 'Failed to get custom thresholds' });
  }
});

// API route to save custom thresholds
app.post('/api/custom-thresholds', express.json(), async (req, res) => {
  try {
    console.log('Saving custom thresholds:', req.body);
    await prisma.customThreshold.deleteMany();
    const thresholds = Object.entries(req.body).map(([productId, threshold]) => ({
      productId,
      threshold: parseInt(threshold)
    }));
    await prisma.customThreshold.createMany({ data: thresholds });
    res.json({ success: true, message: 'Custom thresholds saved successfully' });
  } catch (error) {
    console.error('Error in custom thresholds API:', error);
    res.status(500).json({ success: false, error: 'Failed to save custom thresholds' });
  }
});

// API route to get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json({ products });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Debug route to check custom thresholds
app.get('/api/debug-thresholds', async (req, res) => {
  try {
    const customThresholds = await getCustomThresholds();
    const products = await getAllProducts();
    
    const debug = {
      customThresholds,
      productIds: products.map(p => ({ id: p.id, title: p.title }))
    };
    
    res.json(debug);
  } catch (error) {
    console.error('Error getting debug info:', error);
    res.status(500).json({ error: 'Failed to get debug info' });
  }
});



// API route to get emails
app.get('/api/emails', async (req, res) => {
  try {
    const emails = await prisma.emailLog.findMany({ orderBy: { createdAt: 'desc' } });
    console.log(`Retrieved ${emails.length} emails from database`);
    res.json(emails);
  } catch (error) {
    console.error('Error getting emails:', error);
    res.status(500).json({ error: 'Failed to get emails' });
  }
});

// API route to mark email as read
app.post('/api/emails/:id/read', async (req, res) => {
  try {
    const emailId = parseInt(req.params.id);
    await prisma.emailLog.update({
      where: { id: emailId },
      data: { read: true }
    });
    console.log(`Marked email ${emailId} as read`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking email as read:', error);
    res.status(500).json({ error: 'Failed to mark email as read' });
  }
});

// API route to delete emails
app.post('/api/emails/delete', express.json(), async (req, res) => {
  try {
    const emailIds = req.body.emailIds;
    await prisma.emailLog.deleteMany({
      where: { id: { in: emailIds } }
    });
    console.log(`Deleted ${emailIds.length} emails`);
    res.json({ success: true, deletedCount: emailIds.length });
  } catch (error) {
    console.error('Error deleting emails:', error);
    res.status(500).json({ error: 'Failed to delete emails' });
  }
});

// Initialize scheduled tasks
async function initScheduledTasks() {
  try {
    const settings = await getNotificationSettings();
    
    // Daily check at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily scheduled low stock check...');
      try {
        const settings = await getNotificationSettings();
        
        if (settings.enableAutoCheck) {
          const threshold = settings.defaultThreshold || 5;
          const lowStockItems = await checkLowStock(threshold);
          
          if (lowStockItems.length > 0) {
            await sendLowStockNotifications(lowStockItems);
            
            // Send email notification if enabled
            if (settings.enableEmail) {
              await sendEmailNotification(lowStockItems, threshold);
            }
          }
          
          console.log(`Daily check complete. Found ${lowStockItems.length} items with low stock.`);
        } else {
          console.log('Automatic checks are disabled in settings.');
        }
      } catch (error) {
        console.error('Error in scheduled low stock check:', error);
      }
    });
    
    // Weekly summary report on Sunday at 10:00 AM
    cron.schedule('0 10 * * 0', async () => {
      console.log('Generating weekly summary report...');
      try {
        const settings = await getNotificationSettings();
        
        if (settings.enableEmail) {
          const history = await getLowStockHistory('weekly');
          await sendSummaryReport('weekly', history);
          console.log('Weekly summary report sent.');
        } else {
          console.log('Email notifications are disabled in settings.');
        }
      } catch (error) {
        console.error('Error generating weekly summary report:', error);
      }
    });
    
    // Monthly summary report on the 1st of each month at 10:00 AM
    cron.schedule('0 10 1 * *', async () => {
      console.log('Generating monthly summary report...');
      try {
        const settings = await getNotificationSettings();
        
        if (settings.enableEmail) {
          const history = await getLowStockHistory('monthly');
          await sendSummaryReport('monthly', history);
          console.log('Monthly summary report sent.');
        } else {
          console.log('Email notifications are disabled in settings.');
        }
      } catch (error) {
        console.error('Error generating monthly summary report:', error);
      }
    });
    
    console.log('Scheduled tasks initialized.');
  } catch (error) {
    console.error('Error initializing scheduled tasks:', error);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dashboard available at https://ceymox-internship-low-stock-alert-a.vercel.app`);
  
  // Initialize scheduled tasks
  initScheduledTasks();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});