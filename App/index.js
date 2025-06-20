require('dotenv').config();
const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const cron = require('node-cron');
const fs = require('fs').promises;
const { checkLowStock, sendLowStockNotifications, getLowStockHistory, getCustomThresholds, saveCustomThresholds, getAllProducts } = require('./lowStockChecker');
const { 
  getNotificationSettings, 
  saveNotificationSettings, 
  sendEmailNotification,
  sendSummaryReport
} = require('./notificationService');
const {
  saveShopData,
  getShopData,
  saveShopSettings,
  getShopSettings,
  logLowStockAlert,
  removeShopData
} = require('./database');
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
    console.log('Checking for low stock items...');
    const defaultThreshold = req.query.threshold ? parseInt(req.query.threshold) : 5;
    console.log(`Using default threshold: ${defaultThreshold}`);
    
    const lowStockItems = await checkLowStock(defaultThreshold);
    console.log(`Found ${lowStockItems.length} low stock items`);
    
    if (lowStockItems.length > 0) {
      await sendLowStockNotifications(lowStockItems);
      
      // Send email notification if enabled
      const settings = await getNotificationSettings();
      console.log('Notification settings:', settings);
      
      if (!settings.disableEmail) {
        console.log('Email notifications are enabled, sending email...');
        try {
          const emailSent = await sendEmailNotification(lowStockItems, defaultThreshold);
          console.log('Email notification sent:', emailSent);
          
          // Check if email preview file exists and log its contents
          try {
            const emailPreviewPath = path.join(__dirname, 'data', 'email-preview.txt');
            const emailPreviewExists = await fileExists(emailPreviewPath);
            
            if (emailPreviewExists) {
              const emailPreviewContent = await fs.readFile(emailPreviewPath, 'utf8');
              console.log('Email preview information:');
              console.log(emailPreviewContent);
            } else {
              console.log('No email preview file found');
            }
          } catch (previewError) {
            console.error('Error checking email preview:', previewError);
          }
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

// Helper function to check if a file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

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
    // Save to file system first to ensure it works
    const settingsFile = path.join(__dirname, 'data', 'notification-settings.json');
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(settingsFile, JSON.stringify(req.body, null, 2));
    
    // Then try to save to database
    const success = await saveNotificationSettings(req.body);
    if (success) {
      res.json({ success: true, message: 'Settings saved successfully' });
    } else {
      res.json({ success: true, message: 'Settings saved to file system only' });
    }
  } catch (error) {
    console.error('Error saving settings:', error);
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
    // Save to file system first to ensure it works
    const thresholdsFile = path.join(__dirname, 'data', 'custom-thresholds.json');
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(thresholdsFile, JSON.stringify(req.body, null, 2));
    
    // Then try to save to database
    const success = await saveCustomThresholds(req.body);
    if (success) {
      res.json({ success: true, message: 'Custom thresholds saved successfully' });
    } else {
      res.json({ success: true, message: 'Custom thresholds saved to file system only' });
    }
  } catch (error) {
    console.error('Error saving custom thresholds:', error);
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
    // Try file system first as it's more reliable in Vercel
    const emailsFile = path.join(__dirname, 'data', 'emails.json');
    
    let emails = [];
    try {
      const emailsData = await fs.readFile(emailsFile, 'utf8');
      emails = JSON.parse(emailsData);
      console.log(`Retrieved ${emails.length} emails from file system`);
      
      if (emails.length > 0) {
        return res.json(emails);
      }
    } catch (err) {
      console.log('No emails file found or error reading it:', err.message);
    }
    
    // If file system failed or returned empty, try database
    try {
      const { getEmailsFromDB } = require('./database');
      const dbEmails = await getEmailsFromDB();
      
      if (dbEmails && dbEmails.length > 0) {
        console.log(`Retrieved ${dbEmails.length} emails from database`);
        
        // Save to file system for future use
        try {
          await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
          await fs.writeFile(emailsFile, JSON.stringify(dbEmails, null, 2));
        } catch (writeErr) {
          console.error('Error saving emails to file:', writeErr);
        }
        
        return res.json(dbEmails);
      }
    } catch (dbErr) {
      console.error('Error getting emails from database:', dbErr);
    }
    
    // If both methods failed, return empty array
    res.json([]);
  } catch (error) {
    console.error('Error getting emails:', error);
    res.status(500).json({ error: 'Failed to get emails' });
  }
});

// API route to mark email as read
app.post('/api/emails/:id/read', async (req, res) => {
  try {
    const emailId = parseInt(req.params.id);
    
    // First try to mark as read in database
    const { markEmailAsReadInDB } = require('./database');
    const dbSuccess = await markEmailAsReadInDB(emailId);
    
    if (dbSuccess) {
      console.log(`Marked email ${emailId} as read in database`);
      return res.json({ success: true });
    }
    
    // Fallback to file system if database update failed
    const emailsFile = path.join(__dirname, 'data', 'emails.json');
    
    let emails = [];
    try {
      const emailsData = await fs.readFile(emailsFile, 'utf8');
      emails = JSON.parse(emailsData);
    } catch (err) {
      return res.status(404).json({ error: 'Emails not found' });
    }
    
    const email = emails.find(e => e.id === emailId);
    if (email) {
      email.read = true;
      await fs.writeFile(emailsFile, JSON.stringify(emails, null, 2));
      console.log(`Marked email ${emailId} as read in file system`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Email not found' });
    }
  } catch (error) {
    console.error('Error marking email as read:', error);
    res.status(500).json({ error: 'Failed to mark email as read' });
  }
});

// API route to delete emails
app.post('/api/emails/delete', express.json(), async (req, res) => {
  try {
    const emailIds = req.body.emailIds;
    
    // First try to delete from database
    const { deleteEmailsFromDB } = require('./database');
    const dbSuccess = await deleteEmailsFromDB(emailIds);
    
    if (dbSuccess) {
      console.log(`Deleted ${emailIds.length} emails from database`);
      return res.json({ success: true, deletedCount: emailIds.length });
    }
    
    // Fallback to file system if database deletion failed
    const emailsFile = path.join(__dirname, 'data', 'emails.json');
    
    let emails = [];
    try {
      const emailsData = await fs.readFile(emailsFile, 'utf8');
      emails = JSON.parse(emailsData);
    } catch (err) {
      return res.status(404).json({ error: 'Emails not found' });
    }
    
    // Filter out the emails to be deleted
    const remainingEmails = emails.filter(email => !emailIds.includes(email.id));
    
    await fs.writeFile(emailsFile, JSON.stringify(remainingEmails, null, 2));
    console.log(`Deleted ${emailIds.length} emails from file system`);
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