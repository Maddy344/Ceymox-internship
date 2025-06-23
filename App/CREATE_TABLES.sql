-- Run this SQL in your Supabase SQL Editor

-- Create emails table
CREATE TABLE emails (
  id BIGSERIAL PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  subject TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  html_content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create low_stock_history table
CREATE TABLE low_stock_history (
  id BIGSERIAL PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  threshold INTEGER NOT NULL,
  item_count INTEGER NOT NULL,
  items JSONB NOT NULL
);

-- Create notification_settings table
CREATE TABLE notification_settings (
  id BIGSERIAL PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  email TEXT,
  disable_email BOOLEAN DEFAULT false,
  disable_dashboard BOOLEAN DEFAULT false,
  default_threshold INTEGER DEFAULT 5,
  enable_auto_check BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create custom_thresholds table
CREATE TABLE custom_thresholds (
  id BIGSERIAL PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  product_id TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shop_domain, product_id)
);

-- Insert test email
INSERT INTO emails (shop_domain, subject, from_address, to_address, html_content, read)
VALUES (
  'fakestore-practice1.myshopify.com',
  'Test Low Stock Alert',
  'Low Stock Alert <alerts@lowstockalert.com>',
  'vampirepes24@gmail.com',
  '<h2>Test Email</h2><p>This is a test email to verify the inbox is working.</p>',
  false
);