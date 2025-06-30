const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const db = require('./db')();       

// File to store notification settings
const SETTINGS_FILE = path.join(__dirname, 'data', 'notification-settings.json');

/**
 * Get notification settings
 * @returns {Promise<Object>} - Notification settings
 */
async function getNotificationSettings() {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    
    // Read settings or use defaults
    try {
      const settingsData = await fs.readFile(SETTINGS_FILE, 'utf8');
      return JSON.parse(settingsData);
    } catch (err) {
      // Default settings
      const defaultSettings = {
        email: process.env.NOTIFICATION_EMAIL || '',
        disableEmail: false,
        disableDashboard: false,
        defaultThreshold: 5,
        enableAutoCheck: true
      };
      
      // Save default settings
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      email: process.env.NOTIFICATION_EMAIL || '',
      disableEmail: false,
      disableDashboard: false,
      defaultThreshold: 5,
      enableAutoCheck: true
    };
  }
}

/**
 * Save notification settings
 * @param {Object} settings - Notification settings
 * @returns {Promise<boolean>} - Success status
 */
async function saveNotificationSettings(settings) {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    
    // Save settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return false;
  }
}

/**
 * Send email notification for low stock items
 * @param {Array} lowStockItems - Array of products with low stock
 * @param {number} defaultThreshold - The default stock threshold
 * @returns {Promise<boolean>} - Success status
 */
async function sendEmailNotification(lowStockItems, defaultThreshold) {
  try {
    const settings = await getNotificationSettings();
    
    // Check if email notifications are disabled or no email address is set
    if (settings.disableEmail || !settings.email) {
      console.log('Email notifications are disabled or no email address is set');
      return false;
    }
    
    // Build email content
    let itemsHtml = '';
    lowStockItems.forEach(item => {
  // Calculate total inventory for the product (guard against missing variants)
  const totalInventory = (Array.isArray(item.variants) ? item.variants : [])
    .reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0);
      
      itemsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; ${totalInventory <= 2 ? 'color: red; font-weight: bold;' : ''}">${totalInventory}</td>
        </tr>
      `;
    });
    
    const emailHtml = `
      <h2>Low Stock Alert</h2>
      <p>The following items are running low on stock:</p>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Stock</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p>Please log in to your Shopify admin to manage inventory.</p>
    `;
    
    // -- Build transporter (SMTP only) -------------------------
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
    
    // Send email
    const info = await transporter.sendMail({
      from: '"Low Stock Alert" <alerts@lowstockalert.com>',
      to: settings.email,
      subject: `Low Stock Alert: ${lowStockItems.length} products below threshold`,
      html: emailHtml
    });
    
    console.log('Email notification sent:', info.messageId);
    
    // -- Save a copy to the SQL inbox table --------------------
  try {
    await db.query(
    `INSERT INTO emails
       (subject, from_email, body, sent_at, is_read)
    VALUES
       (?,        ?,          ?,    NOW(),  FALSE)`,
    [
      `Low Stock Alert: ${lowStockItems.length} products below threshold`,
      'Low Stock Alert <alerts@lowstockalert.com>',
      emailHtml
    ]
  );

    console.log('Email saved to SQL inbox');
  } catch (sqlErr) {
    console.error('Failed to save email in SQL:', sqlErr.message);
  }
    
  return true;

  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

/**
 * Generate and send a summary report
 * @param {string} period - 'daily', 'weekly', or 'monthly'
 * @param {Array} historyData - Historical low stock data
 * @returns {Promise<boolean>} - Success status
 */
async function sendSummaryReport(period, historyData) {
  try {
    const settings = await getNotificationSettings();
    
    // Check if email notifications are disabled or no email address is set
    if (settings.disableEmail || !settings.email) {
      console.log('Email notifications are disabled or no email address is set');
      return false;
    }
    
    // Format period for display
    let periodDisplay;
    switch (period) {
      case 'daily':
        periodDisplay = 'Daily';
        break;
      case 'weekly':
        periodDisplay = 'Weekly';
        break;
      case 'monthly':
        periodDisplay = 'Monthly';
        break;
      default:
        periodDisplay = 'Summary';
    }
    
    // Build email content
    let reportHtml = '';
    
    if (historyData.length === 0) {
      reportHtml = '<p>No low stock data available for this period.</p>';
    } else {
      // Group by date
      const groupedData = {};
      
      historyData.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString();
        if (!groupedData[date]) {
          groupedData[date] = {
            count: 0,
            items: new Set()
          };
        }
        
        groupedData[date].count = Math.max(groupedData[date].count, entry.itemCount);
        entry.items.forEach(item => {
          groupedData[date].items.add(item.title);
        });
      });
      
      // Create table rows
      let tableRows = '';
      Object.keys(groupedData).forEach(date => {
        tableRows += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${date}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${groupedData[date].count}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${Array.from(groupedData[date].items).join(', ')}</td>
          </tr>
        `;
      });
      
      reportHtml = `
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Date</th>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Low Stock Items</th>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Products</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    }
    
    const emailHtml = `
      <h2>${periodDisplay} Low Stock Report</h2>
      <p>Here is your ${periodDisplay.toLowerCase()} summary of low stock items:</p>
      ${reportHtml}
      <p>Please log in to your Shopify admin to manage inventory.</p>
    `;
    
    // Create test account for development
    let testAccount;
    let transporter;
    
    if (process.env.NODE_ENV === 'production' && process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Use real SMTP settings in production
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Use Ethereal for testing
      testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }
    
    // Send email
    const info = await transporter.sendMail({
      from: '"Low Stock Alert" <reports@lowstockalert.com>',
      to: settings.email,
      subject: `${periodDisplay} Low Stock Report`,
      html: emailHtml
    });
    
    console.log('Report email sent:', info.messageId);
    
    // Report emails are not saved to inbox
    console.log('Report email sent but not saved to inbox');
    
    return true;
  } catch (error) {
    console.error('Error sending summary report:', error);
    return false;
  }
}

module.exports = {
  getNotificationSettings,
  saveNotificationSettings,
  sendEmailNotification,
  sendSummaryReport
};