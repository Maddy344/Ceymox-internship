-- Create shops table to store shop information and access tokens
CREATE TABLE shops (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shop_settings table to store app settings for each shop
CREATE TABLE shop_settings (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  threshold INTEGER DEFAULT 5,
  email VARCHAR(255),
  auto_alerts_enabled BOOLEAN DEFAULT false,
  disable_email BOOLEAN DEFAULT false,
  disable_dashboard BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (shop_domain) REFERENCES shops(shop_domain) ON DELETE CASCADE
);

-- Create stock_logs table to log low stock alerts (optional)
CREATE TABLE stock_logs (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  stock_quantity INTEGER NOT NULL,
  alert_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (shop_domain) REFERENCES shops(shop_domain) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_shops_domain ON shops(shop_domain);
CREATE INDEX idx_shop_settings_domain ON shop_settings(shop_domain);
CREATE INDEX idx_stock_logs_domain ON stock_logs(shop_domain);
CREATE INDEX idx_stock_logs_time ON stock_logs(alert_time);

-- Enable Row Level Security (RLS)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security needs)
CREATE POLICY "Enable all operations for service role" ON shops FOR ALL USING (true);
CREATE POLICY "Enable all operations for service role" ON shop_settings FOR ALL USING (true);
CREATE POLICY "Enable all operations for service role" ON stock_logs FOR ALL USING (true);