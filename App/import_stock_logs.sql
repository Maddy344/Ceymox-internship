-- First, insert the shop domain into the shops table if it doesn't exist
-- This uses the ON CONFLICT clause to avoid duplicate key errors
-- NOTE: DO NOT put actual tokens here. Use the import_stock_logs.js script instead
-- which will use environment variables from .env file

INSERT INTO shops (shop_domain, access_token)
VALUES 
  ('SHOP_DOMAIN_PLACEHOLDER', 'ACCESS_TOKEN_PLACEHOLDER')
ON CONFLICT (shop_domain) DO NOTHING;

-- Now insert sample stock logs data
INSERT INTO stock_logs (shop_domain, product_id, stock_quantity, alert_time)
VALUES
  ('SHOP_DOMAIN_PLACEHOLDER', '123456789', 3, '2023-10-15T14:30:00Z'),
  ('SHOP_DOMAIN_PLACEHOLDER', '987654321', 2, '2023-10-15T14:35:00Z'),
  ('SHOP_DOMAIN_PLACEHOLDER', '456789123', 1, '2023-10-16T09:15:00Z'),
  ('SHOP_DOMAIN_PLACEHOLDER', '789123456', 4, '2023-10-16T09:20:00Z'),
  ('SHOP_DOMAIN_PLACEHOLDER', '234567891', 2, '2023-10-17T11:45:00Z');

-- Verify the data was imported
SELECT * FROM stock_logs;