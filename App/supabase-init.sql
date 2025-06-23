-- SQL functions to create tables if they don't exist

-- Function to create notification_settings table
CREATE OR REPLACE FUNCTION create_notification_settings_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'notification_settings') THEN
    CREATE TABLE notification_settings (
      id SERIAL PRIMARY KEY,
      shop_domain TEXT NOT NULL UNIQUE,
      email TEXT,
      disable_email BOOLEAN DEFAULT false,
      disable_dashboard BOOLEAN DEFAULT false,
      default_threshold INTEGER DEFAULT 5,
      enable_auto_check BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create custom_thresholds table
CREATE OR REPLACE FUNCTION create_custom_thresholds_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'custom_thresholds') THEN
    CREATE TABLE custom_thresholds (
      id SERIAL PRIMARY KEY,
      shop_domain TEXT NOT NULL,
      product_id TEXT NOT NULL,
      threshold INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(shop_domain, product_id)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create emails table
CREATE OR REPLACE FUNCTION create_emails_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'emails') THEN
    CREATE TABLE emails (
      id SERIAL PRIMARY KEY,
      shop_domain TEXT NOT NULL,
      subject TEXT,
      from_address TEXT,
      to_address TEXT,
      html_content TEXT,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;