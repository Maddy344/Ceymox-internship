const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Only create Supabase client if credentials are provided
let supabase = null;
if (supabaseUrl && supabaseKey && supabaseUrl !== 'your_supabase_url_here') {
  supabase = createClient(supabaseUrl, supabaseKey);
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
    
    console.log(`Removed all data for shop: ${shop}`);
  } catch (error) {
    console.error('Error removing shop data:', error);
  }
}

module.exports = {
  saveShopData,
  getShopData,
  saveShopSettings,
  getShopSettings,
  logLowStockAlert,
  removeShopData
};