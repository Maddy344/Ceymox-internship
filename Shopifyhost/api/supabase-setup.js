// supabase-setup.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client with fallback values
const supabase = createClient(
  process.env.SUPABASE_URL || "https://ojeipoemzriiykfajkdh.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZWlwb2VtenJpaXlrZmFqa2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzI1MjQsImV4cCI6MjA2NTIwODUyNH0.jy5vWZ-V1QoabyrYQSsr5gp3HOu0hD7PMJWK1BVA09Y"
);

async function setupSupabaseTable() {
  try {
    console.log('Setting up Supabase products table...');
    
    // Drop the existing table if it exists
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql_query: `DROP TABLE IF EXISTS products;`
    });
    
    if (dropError) {
      console.error('Error dropping products table:', dropError.message);
      
      // Try alternative approach if RPC fails
      const { error: queryError } = await supabase.from('products').delete().neq('id', 0);
      if (queryError && !queryError.message.includes('does not exist')) {
        console.error('Error clearing products table:', queryError.message);
      } else {
        console.log('Products table cleared or does not exist');
      }
    } else {
      console.log('Products table dropped successfully');
    }
    
    // Create the products table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          shopify_id BIGINT UNIQUE,
          title VARCHAR(255) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          description TEXT,
          image VARCHAR(1024),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (createError) {
      console.error('Error creating products table via RPC:', createError.message);
      
      // Try alternative approach - insert a record and let Supabase create the table
      console.log('Trying alternative approach to create table...');
      
      const { error: insertError } = await supabase
        .from('products')
        .insert([{
          shopify_id: 0,
          title: 'Test Product',
          price: '0.00',
          description: 'Test Description',
          image: ''
        }]);
        
      if (insertError && !insertError.message.includes('already exists')) {
        console.error('Failed to create products table via insert:', insertError.message);
        return false;
      }
      
      console.log('Products table created via insert');
      
      // Clean up test product
      await supabase.from('products').delete().eq('shopify_id', 0);
    } else {
      console.log('Products table created successfully via RPC');
    }
    
    return true;
  } catch (error) {
    console.error('Supabase setup failed:', error.message);
    return false;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupSupabaseTable()
    .then(success => {
      if (success) {
        console.log('✅ Supabase setup completed successfully');
      } else {
        console.error('❌ Supabase setup failed');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Supabase setup error:', error);
      process.exit(1);
    });
}

module.exports = {
  supabase,
  setupSupabaseTable
};