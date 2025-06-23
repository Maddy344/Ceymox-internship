const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Get Supabase credentials from environment with fallbacks
const supabaseUrl = process.env.SUPABASE_URL || 'https://hgwunfhlezzxnhwbvozs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnd3VuZmhsZXp6eG5od2J2b3pzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY2MTY2NCwiZXhwIjoyMDY2MjM3NjY0fQ.lINkQ1l7rGtWr1K0zV1Wuig4wanjwPxKPone1LXiM8U';

// Create Supabase client
let supabase = null;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized with URL:', supabaseUrl);
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}













/**
 * Get notification settings from Supabase
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
 * Save notification settings to Supabase
 */
async function saveNotificationSettingsToDB(settings) {
  console.log('Settings saved (hardcoded):', settings);
  return true;
}

/**
 * Save settings to file as fallback
 */
async function saveSettingsToFile(settings) {
  try {
    const settingsFile = path.join(__dirname, 'data', 'notification-settings.json');
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(settingsFile, JSON.stringify(settings, null, 2));
    console.log('Settings saved to file as fallback');
    return true;
  } catch (error) {
    console.error('Error saving settings to file:', error);
    return false;
  }
}

/**
 * Get custom thresholds from Supabase (using stock_logs table)
 */
async function getCustomThresholdsFromDB() {
  if (!supabase) return {};
  
  try {
    const { data, error } = await supabase
      .from('custom_thresholds')
      .select('product_id, threshold')
      .eq('shop_domain', 'fakestore-practice1.myshopify.com');
    
    if (error) return {};
    
    const thresholds = {};
    if (data) {
      data.forEach(item => {
        thresholds[item.product_id] = item.threshold;
      });
    }
    
    return thresholds;
  } catch (error) {
    return {};
  }
}

/**
 * Save custom thresholds to Supabase (using stock_logs table)
 */
async function saveCustomThresholdsToDB(thresholds) {
  if (!supabase) return false;
  
  try {
    const shop = 'fakestore-practice1.myshopify.com';
    
    // Delete existing thresholds
    await supabase.from('custom_thresholds').delete().eq('shop_domain', shop);
    
    const records = Object.entries(thresholds).map(([productId, threshold]) => ({
      shop_domain: shop,
      product_id: productId,
      threshold: threshold
    }));
    
    if (records.length > 0) {
      const { error } = await supabase
        .from('custom_thresholds')
        .insert(records);
      
      console.log('Thresholds save result:', error ? error.message : 'SUCCESS');
      return !error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving thresholds:', error);
    return false;
  }
}

/**
 * Save thresholds to file as fallback
 */
async function saveThresholdsToFile(thresholds) {
  try {
    const thresholdsFile = path.join(__dirname, 'data', 'custom-thresholds.json');
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(thresholdsFile, JSON.stringify(thresholds, null, 2));
    console.log('Thresholds saved to file as fallback');
    return true;
  } catch (error) {
    console.error('Error saving thresholds to file:', error);
    return false;
  }
}

/**
 * Save email to Supabase
 */
async function saveEmailToDB(emailRecord) {
  if (!supabase) {
    console.log('Supabase not configured, skipping email save');
    return false;
  }
  
  try {
    const shop = process.env.SHOP_DOMAIN || 'fakestore-practice1.myshopify.com';
    
    console.log('Attempting to save email to Supabase:', {
      shop,
      subject: emailRecord.subject,
      from: emailRecord.from,
      to: emailRecord.to
    });
    
    const { data, error } = await supabase
      .from('emails')
      .insert({
        shop_domain: shop,
        subject: emailRecord.subject,
        from_address: emailRecord.from,
        to_address: emailRecord.to,
        html_content: emailRecord.html,
        read: false
      })
      .select();
    
    if (error) {
      console.error('Supabase email insert error:', error);
      throw error;
    }
    
    console.log('Email saved to Supabase successfully:', data);
    return true;
  } catch (error) {
    console.error('Error saving email to DB:', error);
    
    // If table doesn't exist, provide helpful error message
    if (error.code === '42P01') {
      console.error('❌ CRITICAL: emails table does not exist in Supabase!');
      console.error('Please run the SQL commands in SUPABASE_FIX.sql in your Supabase dashboard.');
    }
    
    return false;
  }
}

/**
 * Get emails from Supabase
 */
async function getEmailsFromDB() {
  if (!supabase) {
    console.log('Supabase not configured, returning empty emails');
    return [];
  }
  
  try {
    const shop = process.env.SHOP_DOMAIN || 'fakestore-practice1.myshopify.com';
    
    console.log('Fetching emails from Supabase for shop:', shop);
    
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('shop_domain', shop)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase email fetch error:', error);
      throw error;
    }
    
    console.log(`Found ${data.length} emails in Supabase`);
    
    // Convert from DB format to app format
    return data.map(email => ({
      id: email.id,
      subject: email.subject,
      from: email.from_address,
      to: email.to_address,
      date: email.created_at,
      html: email.html_content,
      read: email.read
    }));
  } catch (error) {
    console.error('Error getting emails from DB:', error);
    
    // If table doesn't exist, provide helpful error message
    if (error.code === '42P01') {
      console.error('❌ CRITICAL: emails table does not exist in Supabase!');
      console.error('Please run the SQL commands in SUPABASE_FIX.sql in your Supabase dashboard.');
    }
    
    return [];
  }
}

/**
 * Mark email as read in Supabase
 */
async function markEmailAsReadInDB(emailId) {
  if (!supabase) {
    console.log('Supabase not configured, skipping email update');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('emails')
      .update({ read: true })
      .eq('id', emailId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking email as read in DB:', error);
    return false;
  }
}

/**
 * Delete emails from Supabase
 */
async function deleteEmailsFromDB(emailIds) {
  if (!supabase) {
    console.log('Supabase not configured, skipping email deletion');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('emails')
      .delete()
      .in('id', emailIds);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting emails from DB:', error);
    return false;
  }
}

/**
 * Save low stock history to Supabase
 */
async function saveLowStockHistoryToDB(entry) {
  if (!supabase) {
    console.log('Supabase not configured, skipping history save');
    return false;
  }
  
  try {
    const shop = 'fakestore-practice1.myshopify.com';
    
    const { error } = await supabase
      .from('low_stock_history')
      .insert({
        shop_domain: shop,
        date: entry.date,
        threshold: entry.threshold,
        item_count: entry.itemCount,
        items: entry.items
      });
    
    if (error) throw error;
    console.log('📈 Low stock history saved to database');
    return true;
  } catch (error) {
    console.error('Error saving low stock history to DB:', error);
    return false;
  }
}

/**
 * Get low stock history from Supabase
 */
async function getLowStockHistoryFromDB() {
  if (!supabase) {
    console.log('Supabase not configured, returning empty history');
    return [];
  }
  
  try {
    const shop = 'fakestore-practice1.myshopify.com';
    
    const { data, error } = await supabase
      .from('low_stock_history')
      .select('*')
      .eq('shop_domain', shop)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    console.log(`📈 Retrieved ${data.length} history entries from database`);
    
    // Convert from DB format to app format
    return data.map(entry => ({
      date: entry.date,
      threshold: entry.threshold,
      itemCount: entry.item_count,
      items: entry.items
    }));
  } catch (error) {
    console.error('Error getting low stock history from DB:', error);
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