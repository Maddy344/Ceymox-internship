require('dotenv').config();
const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const cron = require('node-cron');
const fs = require('fs').promises;
const db = require('./db');  
const lowStock = require('./lowStockChecker')(db);   
const {
  checkLowStock,
  sendLowStockNotifications,
  getLowStockHistory,
  getCustomThresholds,
  saveCustomThresholds,
  getAllProducts
} = lowStock;                                   
const {
  getNotificationSettings,
  saveNotificationSettings,
  sendEmailNotification,
  sendSummaryReport
} = require('./notificationService');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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
    const success = await saveNotificationSettings(req.body);
    if (success) {
      res.json({ success: true, message: 'Settings saved successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save settings' });
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
    const success = await saveCustomThresholds(req.body);
    if (success) {
      res.json({ success: true, message: 'Custom thresholds saved successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save custom thresholds' });
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

// ────────────── SQL inbox routes ──────────────

// 1) list emails
app.get('/api/emails', async (req, res) => {
    try {
      const [rows] = await db.query(
      `SELECT id,
          subject,
          from_email AS \`from\`,
          body       AS html,
          sent_at    AS date,
          is_read    AS \`read\`
        FROM emails
      ORDER BY sent_at DESC`
    );
    res.json(rows);

  } catch (err) {
    console.error('SQL /api/emails:', err);
    res.status(500).json({ error: 'Failed to load emails' });
  }
});

// 2) mark one email as read
app.post('/api/emails/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE emails SET is_read = TRUE WHERE id = ?', [
      req.params.id
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error('SQL mark read:', err);
    res.status(500).json({ error: 'Failed to mark email as read' });
  }
});


// 3) delete selected emails
app.post('/api/emails/delete', async (req, res) => {
  try {
    const { emailIds } = req.body;          // expects array of IDs
    if (!Array.isArray(emailIds) || !emailIds.length) {
      return res.status(400).json({ error: 'No IDs supplied' });
    }
    await db.query('DELETE FROM emails WHERE id IN (?)', [emailIds]);
    res.json({ success: true, deletedCount: emailIds.length });
  } catch (err) {
    console.error('SQL delete emails:', err);
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
  console.log(`Dashboard available at http://localhost:${PORT}`);
  
  // Initialize scheduled tasks
  initScheduledTasks();
  
  // Open in Chrome
  const url = `http://localhost:${PORT}`;
  console.log(`Opening ${url} in Chrome...`);
  
  // Use the appropriate command based on the operating system
  const command = `start chrome ${url}`;
  exec(command, (error) => {
    if (error) {
      console.error(`Failed to open Chrome: ${error}`);
    }
  });
});