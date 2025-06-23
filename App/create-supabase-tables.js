// Create Supabase tables directly
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function createTables() {
  console.log('Creating Supabase tables...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create shops table
    console.log('Creating shops table...');
    const { error: shopsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS shops (
          id SERIAL PRIMARY KEY,
          shop_domain VARCHAR(255) UNIQUE NOT NULL,
          access_token TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (shopsError) {
      console.error('Error creating shops table:', shopsError);
    } else {
      console.log('✓ shops table created');
    }
    
    // Create shop_settings table
    console.log('Creating shop_settings table...');
    const { error: settingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS shop_settings (
          id SERIAL PRIMARY KEY,
          shop_domain VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255),
          threshold INTEGER DEFAULT 5,
          auto_alerts_enabled BOOLEAN DEFAULT true,
          disable_email BOOLEAN DEFAULT false,
          disable_dashboard BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (settingsError) {
      console.error('Error creating shop_settings table:', settingsError);
    } else {
      console.log('✓ shop_settings table created');
    }
    
    // Create stock_logs table
    console.log('Creating stock_logs table...');
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS stock_logs (
          id SERIAL PRIMARY KEY,
          shop_domain VARCHAR(255) NOT NULL,
          product_id VARCHAR(255) NOT NULL,
          stock_quantity INTEGER NOT NULL,
          alert_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (logsError) {
      console.error('Error creating stock_logs table:', logsError);
    } else {
      console.log('✓ stock_logs table created');
    }
    
    // Create emails table
    console.log('Creating emails table...');
    const { error: emailsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS emails (
          id SERIAL PRIMARY KEY,
          shop_domain VARCHAR(255) NOT NULL,
          subject TEXT NOT NULL,
          from_address TEXT NOT NULL,
          to_address TEXT NOT NULL,
          html_content TEXT NOT NULL,
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (emailsError) {
      console.error('Error creating emails table:', emailsError);
    } else {
      console.log('✓ emails table created');
    }
    
    // Create low_stock_history table
    console.log('Creating low_stock_history table...');
    const { error: historyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS low_stock_history (
          id SERIAL PRIMARY KEY,
          shop_domain VARCHAR(255) NOT NULL,
          date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          threshold INTEGER NOT NULL,
          item_count INTEGER NOT NULL,
          items JSONB NOT NULL
        );
      `
    });
    
    if (historyError) {
      console.error('Error creating low_stock_history table:', historyError);
    } else {
      console.log('✓ low_stock_history table created');
    }
    
    console.log('All tables created successfully!');
    
    // Test by inserting some data
    console.log('Testing table access...');
    const shop = process.env.SHOP_DOMAIN || 'test-shop';
    
    // Insert test shop
    const { error: insertShopError } = await supabase
      .from('shops')
      .upsert({
        shop_domain: shop,
        access_token: 'test_token'
      });
    
    if (insertShopError) {
      console.error('Error inserting test shop:', insertShopError);
    } else {
      console.log('✓ Test shop inserted');
    }
    
    // Insert test settings
    const { error: insertSettingsError } = await supabase
      .from('shop_settings')
      .upsert({
        shop_domain: shop,
        email: process.env.NOTIFICATION_EMAIL || 'test@example.com',
        threshold: 5
      });
    
    if (insertSettingsError) {
      console.error('Error inserting test settings:', insertSettingsError);
    } else {
      console.log('✓ Test settings inserted');
    }
    
    console.log('Database initialization complete!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

createTables();