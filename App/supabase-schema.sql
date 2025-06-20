-- Add new tables for app data

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

-- Create emails table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_settings_shop ON notification_settings(shop_domain);
CREATE INDEX IF NOT EXISTS idx_custom_thresholds_shop ON custom_thresholds(shop_domain);
CREATE INDEX IF NOT EXISTS idx_emails_shop ON emails(shop_domain);
CREATE INDEX IF NOT EXISTS idx_low_stock_history_shop ON low_stock_history(shop_domain);
CREATE INDEX IF NOT EXISTS idx_low_stock_history_date ON low_stock_history(date);