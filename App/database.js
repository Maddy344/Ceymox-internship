const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Hardcoded Supabase credentials as fallback
const HARDCODED_SUPABASE_URL = 'https://pqifekkoglrgjiiprrlr.supabase.co';
const HARDCODED_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaWZla2tvZ2xyZ2ppaXBycmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDI3NzcsImV4cCI6MjA2NTk3ODc3N30.uCTd36g0DaINiEq-7do_OO0tdhGvVnr_J7yArnN7Alk';

// Get Supabase credentials from environment or use hardcoded values
const supabaseUrl = process.env.SUPABASE_URL || HARDCODED_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || HARDCODED_SUPABASE_KEY;

// Create Supabase client
let supabase = null;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized with URL:', supabaseUrl);
    
    // Test connection and create tables
    initializeTables();
  } else {
    console.warn('Supabase credentials missing. Database operations will be skipped.');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}

// Initialize tables and add dummy data
async function initializeTables() {
  if (!supabase) return;
  
  setTimeout(async () => {
    try {
      // Add dummy data directly (tables should exist)
      await supabase.from('shops').upsert({
        shop_domain: 'DUMMY_SHOP',
        access_token: 'dummy_token'
      });
      
      await supabase.from('shop_settings').upsert({
        shop_domain: 'DUMMY_SHOP',
        email: 'dummy@example.com',
        threshold: 5
      });
      
      await supabase.from('stock_logs').insert({
        shop_domain: 'DUMMY_SHOP',
        product_id: 'DUMMY_PRODUCT',
        stock_quantity: 5
      });
      
      console.log('Dummy data added');
    } catch (error) {
      console.log('Dummy data error:', error.message);
    }
  }, 1000);
}

/**
 * Store shop information and access token
 */
async function saveShopData(shop, accessToken) {
  if (!supabase) {
    console.log('Supabase not configured, skipping shop data save');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('shops')
      .upsert({
        shop_domain: shop,
        access_token: accessToken,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'shop_domain'
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving shop data:', error);
    throw error;
  }
}

/**
 * Get shop data by domain
 */
async function getShopData(shop) {
  if (!supabase) {
    console.log('Supabase not configured, returning null');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('shop_domain', shop)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error getting shop data:', error);
    return null;
  }
}

/**
 * Save shop settings
 */
async function saveShopSettings(shop, settings) {
  if (!supabase) {
    console.log('Supabase not configured, skipping settings save');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('shop_settings')
      .upsert({
        shop_domain: shop,
        threshold: settings.defaultThreshold || 5,
        email: settings.email,
        auto_alerts_enabled: settings.enableAutoCheck || false,
        disable_email: settings.disableEmail || false,
        disable_dashboard: settings.disableDashboard || false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'shop_domain'
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving shop settings:', error);
    throw error;
  }
}

/**
 * Get shop settings
 */
async function getShopSettings(shop) {
  if (!supabase) {
    console.log('Supabase not configured, returning null');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('shop_domain', shop)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error getting shop settings:', error);
    return null;
  }
}

/**
 * Log low stock alert
 */
async function logLowStockAlert(shop, productId, stockQuantity) {
  if (!supabase) {
    console.log('Supabase not configured, skipping log');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('stock_logs')
      .insert({
        shop_domain: shop,
        product_id: productId,
        stock_quantity: stockQuantity,
        alert_time: new Date().toISOString()
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging stock alert:', error);
  }
}

/**
 * Remove shop data (for uninstall)
 */
async function removeShopData(shop) {
  if (!supabase) {
    console.log('Supabase not configured, skipping data removal');
    return;
  }
  
  try {
    // Remove from all tables
    await supabase.from('shops').delete().eq('shop_domain', shop);
    await supabase.from('shop_settings').delete().eq('shop_domain', shop);
    await supabase.from('stock_logs').delete().eq('shop_domain', shop);
    await supabase.from('notification_settings').delete().eq('shop_domain', shop);
    await supabase.from('custom_thresholds').delete().eq('shop_domain', shop);
    await supabase.from('emails').delete().eq('shop_domain', shop);
    await supabase.from('low_stock_history').delete().eq('shop_domain', shop);
    
    console.log(`Removed all data for shop: ${shop}`);
  } catch (error) {
    console.error('Error removing shop data:', error);
  }
}

/**
 * Get notification settings from Supabase
 */
async function getNotificationSettingsFromDB() {
  if (!supabase) {
    return {
      email: process.env.NOTIFICATION_EMAIL || '',
      disableEmail: false,
      disableDashboard: false,
      defaultThreshold: 5,
      enableAutoCheck: true
    };
  }
  
  try {
    const shop = process.env.SHOP_DOMAIN || 'default-shop';
    
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('shop_domain', shop)
      .single();
    
    if (error || !data) {
      return {
        email: process.env.NOTIFICATION_EMAIL || '',
        disableEmail: false,
        disableDashboard: false,
        defaultThreshold: 5,
        enableAutoCheck: true
      };
    }
    
    return {
      email: data.email || '',
      disableEmail: data.disable_email || false,
      disableDashboard: data.disable_dashboard || false,
      defaultThreshold: data.threshold || 5,
      enableAutoCheck: data.auto_alerts_enabled || true
    };
  } catch (error) {
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
 * Save notification settings to Supabase
 */
async function saveNotificationSettingsToDB(settings) {
  if (!supabase) return false;
  
  try {
    const shop = process.env.SHOP_DOMAIN || 'default-shop';
    
    // First ensure shop exists
    await supabase.from('shops').upsert({
      shop_domain: shop,
      access_token: 'default_token'
    });
    
    // Delete dummy data
    await supabase.from('shop_settings').delete().eq('shop_domain', 'DUMMY_SHOP');
    
    const { error } = await supabase
      .from('shop_settings')
      .upsert({
        shop_domain: shop,
        email: settings.email || '',
        threshold: settings.defaultThreshold || 5,
        auto_alerts_enabled: settings.enableAutoCheck || true,
        disable_email: settings.disableEmail || false,
        disable_dashboard: settings.disableDashboard || false
      });
    
    console.log('Settings save result:', error ? error.message : 'SUCCESS');
    return !error;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
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
    const shop = process.env.SHOP_DOMAIN || 'default-shop';
    
    const { data, error } = await supabase
      .from('stock_logs')
      .select('product_id, stock_quantity')
      .eq('shop_domain', shop)
      .lt('stock_quantity', 0); // Get negative values (thresholds)
    
    if (error) return {};
    
    const thresholds = {};
    if (data) {
      data.forEach(item => {
        thresholds[item.product_id] = Math.abs(item.stock_quantity); // Convert back to positive
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
    const shop = process.env.SHOP_DOMAIN || 'default-shop';
    
    // First ensure shop exists
    await supabase.from('shops').upsert({
      shop_domain: shop,
      access_token: 'default_token'
    });
    
    // Delete dummy data and existing thresholds
    await supabase.from('stock_logs').delete().eq('shop_domain', 'DUMMY_SHOP');
    await supabase.from('stock_logs').delete().eq('shop_domain', shop).lt('stock_quantity', 0);
    
    const records = Object.entries(thresholds).map(([productId, threshold]) => ({
      shop_domain: shop,
      product_id: productId,
      stock_quantity: -threshold
    }));
    
    if (records.length > 0) {
      const { error } = await supabase
        .from('stock_logs')
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
    const shop = process.env.SHOP_DOMAIN || 'default-shop';
    
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
    const shop = process.env.SHOP_DOMAIN || 'default-shop';
    
    const { data, error } = await supabase
      .from('low_stock_history')
      .select('*')
      .eq('shop_domain', shop)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
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
  saveShopData,
  getShopData,
  saveShopSettings,
  getShopSettings,
  logLowStockAlert,
  removeShopData,
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