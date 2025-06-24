const nodemailer = require('nodemailer');
const prisma = require('./prisma-client');

/**
 * Get notification settings
 * @returns {Promise<Object>} - Notification settings
 */
async function getNotificationSettings() {
  try {
    const settings = await prisma.notificationSettings.findFirst();
    if (settings) {
      console.log('Retrieved settings from database:', settings);
      return settings;
    }
    
    // Return default settings
    const defaultSettings = {
      email: 'vampirepes24@gmail.com',
      disableEmail: false,
      disableDashboard: false,
      defaultThreshold: 5,
      enableAutoCheck: true
    };
    
    // Create default settings in database
    await prisma.notificationSettings.create({ data: defaultSettings });
    return defaultSettings;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      email: 'vampirepes24@gmail.com',
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
    await prisma.notificationSettings.deleteMany();
    await prisma.notificationSettings.create({ data: settings });
    console.log('Saved settings to database');
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
      // Calculate total inventory for the product
      let totalInventory = 0;
      item.variants.forEach(variant => {
        if (variant.inventory_management === 'shopify') {
          totalInventory += variant.inventory_quantity;
        }
      });
      
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
      from: '"Low Stock Alert" <alerts@lowstockalert.com>',
      to: settings.email,
      subject: `Low Stock Alert: ${lowStockItems.length} products below threshold`,
      html: emailHtml
    });
    
    console.log('Email notification sent:', info.messageId);
    
    // Always save email message for Email Status Checker (unless dashboard notifications are disabled)
    if (!settings.disableDashboard) {
      const emailRecord = {
        subject: `Low Stock Alert: ${lowStockItems.length} products below threshold`,
        fromEmail: 'Low Stock Alert <alerts@lowstockalert.com>',
        toEmail: settings.email,
        html: emailHtml,
        read: false
      };
      
      try {
        await prisma.emailLog.create({ data: emailRecord });
        console.log('Email saved to database inbox');
      } catch (dbError) {
        console.error('Error saving email to database:', dbError);
      }
    } else {
      console.log('Dashboard notifications are disabled - email not saved to inbox');
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