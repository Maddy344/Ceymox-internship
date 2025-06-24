const fs = require('fs').promises;
const path = require('path');

/**
 * Get notification settings from file
 */
async function getNotificationSettingsFromDB() {
  return {
    email: 'vampirepes24@gmail.com',
    disableEmail: false,
    disableDashboard: false,
    defaultThreshold: 5,
    enableAutoCheck: true
  };
}

/**
 * Save notification settings to file
 */
async function saveNotificationSettingsToDB(settings) {
  try {
    const settingsFile = path.join(__dirname, 'data', 'notification-settings.json');
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(settingsFile, JSON.stringify(settings, null, 2));
    console.log('Settings saved to file');
    return true;
  } catch (error) {
    console.error('Error saving settings to file:', error);
    return false;
  }
}

/**
 * Get custom thresholds from file
 */
async function getCustomThresholdsFromDB() {
  try {
    const thresholdsFile = path.join(__dirname, 'data', 'custom-thresholds.json');
    const data = await fs.readFile(thresholdsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

/**
 * Save custom thresholds to file
 */
async function saveCustomThresholdsToDB(thresholds) {
  try {
    const thresholdsFile = path.join(__dirname, 'data', 'custom-thresholds.json');
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(thresholdsFile, JSON.stringify(thresholds, null, 2));
    console.log('Thresholds saved to file');
    return true;
  } catch (error) {
    console.error('Error saving thresholds to file:', error);
    return false;
  }
}

/**
 * Save email to file
 */
async function saveEmailToDB(emailRecord) {
  try {
    const emailsFile = path.join(__dirname, 'data', 'emails.json');
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    
    let emails = [];
    try {
      const data = await fs.readFile(emailsFile, 'utf8');
      emails = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    const newEmail = {
      id: Date.now(),
      subject: emailRecord.subject,
      from: emailRecord.from,
      to: emailRecord.to,
      date: new Date().toISOString(),
      html: emailRecord.html,
      read: false
    };
    
    emails.unshift(newEmail);
    await fs.writeFile(emailsFile, JSON.stringify(emails, null, 2));
    console.log('Email saved to file');
    return true;
  } catch (error) {
    console.error('Error saving email to file:', error);
    return false;
  }
}

/**
 * Get emails from file
 */
async function getEmailsFromDB() {
  try {
    const emailsFile = path.join(__dirname, 'data', 'emails.json');
    const data = await fs.readFile(emailsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No emails file found, returning empty array');
    return [];
  }
}

/**
 * Mark email as read in file
 */
async function markEmailAsReadInDB(emailId) {
  try {
    const emailsFile = path.join(__dirname, 'data', 'emails.json');
    const data = await fs.readFile(emailsFile, 'utf8');
    const emails = JSON.parse(data);
    
    const email = emails.find(e => e.id === emailId);
    if (email) {
      email.read = true;
      await fs.writeFile(emailsFile, JSON.stringify(emails, null, 2));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking email as read:', error);
    return false;
  }
}

/**
 * Delete emails from file
 */
async function deleteEmailsFromDB(emailIds) {
  try {
    const emailsFile = path.join(__dirname, 'data', 'emails.json');
    const data = await fs.readFile(emailsFile, 'utf8');
    const emails = JSON.parse(data);
    
    const filteredEmails = emails.filter(email => !emailIds.includes(email.id));
    await fs.writeFile(emailsFile, JSON.stringify(filteredEmails, null, 2));
    return true;
  } catch (error) {
    console.error('Error deleting emails:', error);
    return false;
  }
}

/**
 * Save low stock history to file
 */
async function saveLowStockHistoryToDB(entry) {
  try {
    const historyFile = path.join(__dirname, 'data', 'low-stock-history.json');
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    
    let history = [];
    try {
      const data = await fs.readFile(historyFile, 'utf8');
      history = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    history.unshift(entry);
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
    console.log('📈 Low stock history saved to file');
    return true;
  } catch (error) {
    console.error('Error saving low stock history to file:', error);
    return false;
  }
}

/**
 * Get low stock history from file
 */
async function getLowStockHistoryFromDB() {
  try {
    const historyFile = path.join(__dirname, 'data', 'low-stock-history.json');
    const data = await fs.readFile(historyFile, 'utf8');
    const history = JSON.parse(data);
    console.log(`📈 Retrieved ${history.length} history entries from file`);
    return history;
  } catch (error) {
    console.log('No history file found, returning empty array');
    return [];
  }
}

module.exports = {
  getNotificationSettingsFromDB,
  saveNotificationSettingsToDB,
  getCustomThresholdsFromDB,
  saveCustomThresholdsToDB,
  saveEmailToDB,
  getEmailsFromDB,
  markEmailAsReadInDB,
  deleteEmailsFromDB,
  saveLowStockHistoryToDB,
  getLowStockHistoryFromDB
};