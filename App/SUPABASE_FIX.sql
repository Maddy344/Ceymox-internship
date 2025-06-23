-- SUPABASE TABLE CREATION SCRIPT
-- Run these commands in your Supabase SQL Editor to fix the missing tables

-- Create emails table (CRITICAL - this is why emails aren't showing in inbox)
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

-- Create low_stock_history table
CREATE TABLE IF NOT EXISTS low_stock_history (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  threshold INTEGER NOT NULL,
  item_count INTEGER NOT NULL,
  items JSONB NOT NULL
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  disable_email BOOLEAN DEFAULT false,
  disable_dashboard BOOLEAN DEFAULT false,
  default_threshold INTEGER DEFAULT 5,
  enable_auto_check BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_thresholds table
CREATE TABLE IF NOT EXISTS custom_thresholds (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  threshold INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_domain, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emails_shop ON emails(shop_domain);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);
CREATE INDEX IF NOT EXISTS idx_low_stock_history_shop ON low_stock_history(shop_domain);
CREATE INDEX IF NOT EXISTS idx_low_stock_history_date ON low_stock_history(date);
CREATE INDEX IF NOT EXISTS idx_notification_settings_shop ON notification_settings(shop_domain);
CREATE INDEX IF NOT EXISTS idx_custom_thresholds_shop ON custom_thresholds(shop_domain);

-- Insert initial data for your shop
INSERT INTO notification_settings (shop_domain, email, threshold, auto_alerts_enabled, disable_email, disable_dashboard)
VALUES ('fakestore-practice1.myshopify.com', 'vampirepes24@gmail.com', 5, true, false, false)
ON CONFLICT (shop_domain) DO NOTHING;

-- Test the tables by inserting a sample email
INSERT INTO emails (shop_domain, subject, from_address, to_address, html_content, read)
VALUES (
  'fakestore-practice1.myshopify.com',
  'Test Low Stock Alert',
  'Low Stock Alert <alerts@lowstockalert.com>',
  'vampirepes24@gmail.com',
  '<h2>Test Email</h2><p>This is a test email to verify the inbox is working.</p>',
  false
);

-- Verify tables were created
SELECT 'emails' as table_name, count(*) as row_count FROM emails
UNION ALL
SELECT 'low_stock_history' as table_name, count(*) as row_count FROM low_stock_history
UNION ALL
SELECT 'notification_settings' as table_name, count(*) as row_count FROM notification_settings
UNION ALL
SELECT 'custom_thresholds' as table_name, count(*) as row_count FROM custom_thresholds;