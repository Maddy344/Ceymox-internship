const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get sensitive data from environment variables
const shopDomain = process.env.SHOP_DOMAIN;
const accessToken = process.env.ACCESS_TOKEN;

async function importFromSQL() {
  try {
    console.log('Starting SQL import process...');
    
    // Read the SQL file
    const sqlTemplate = fs.readFileSync(
      path.join(__dirname, 'import_stock_logs.sql'), 
      'utf8'
    );
    
    // Replace placeholders with environment variables
    const sql = sqlTemplate
      .replace(/SHOP_DOMAIN_PLACEHOLDER/g, shopDomain)
      .replace(/ACCESS_TOKEN_PLACEHOLDER/g, accessToken);
    
    // Execute the SQL using Supabase's REST API
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      console.log('Falling back to direct API calls...');
      await importFromCSV();
    } else {
      console.log('SQL import completed successfully');
    }
  } catch (err) {
    console.error('Error with SQL import:', err);
    console.log('Falling back to direct API calls...');
    await importFromCSV();
  }
}

async function importFromCSV() {
  try {
    console.log('Starting CSV import process...');
    
    // First, ensure the shop exists in the shops table
    const { data: existingShop } = await supabase
      .from('shops')
      .select('shop_domain')
      .eq('shop_domain', shopDomain)
      .single();
    
    if (!existingShop) {
      console.log(`Adding shop: ${shopDomain}`);
      const { error: shopError } = await supabase
        .from('shops')
        .insert({ shop_domain: shopDomain, access_token: accessToken });
      
      if (shopError) {
        console.error('Error inserting shop:', shopError);
        return;
      }
    }
    
    // Array to store CSV data
    const stockLogs = [];
    
    // Read and parse the CSV file
    fs.createReadStream(path.join(__dirname, 'data', 'stock_logs.csv'))
      .pipe(csv())
      .on('data', (row) => {
        // Replace any hardcoded shop domain with environment variable
        stockLogs.push({
          shop_domain: shopDomain,
          product_id: row.product_id,
          stock_quantity: parseInt(row.stock_quantity),
          alert_time: row.alert_time
        });
      })
      .on('end', async () => {
        console.log('CSV file successfully processed');
        
        // Insert the stock logs
        const { error } = await supabase
          .from('stock_logs')
          .insert(stockLogs);
        
        if (error) {
          console.error('Error inserting stock logs:', error);
        } else {
          console.log('Data successfully imported into stock_logs table');
        }
      });
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Start the import process
importFromSQL();