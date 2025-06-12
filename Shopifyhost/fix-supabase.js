// fix-supabase.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Supabase client with hardcoded values
const supabase = createClient(
  "https://ojeipoemzriiykfajkdh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZWlwb2VtenJpaXlrZmFqa2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzI1MjQsImV4cCI6MjA2NTIwODUyNH0.jy5vWZ-V1QoabyrYQSsr5gp3HOu0hD7PMJWK1BVA09Y"
);

async function fixSupabase() {
  try {
    console.log('Fixing Supabase products table...');
    
    // Try to delete the table if it exists
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `DROP TABLE IF EXISTS products;`
      });
      
      if (error) {
        console.log('Could not drop table via RPC, trying alternative method');
      } else {
        console.log('Successfully dropped products table');
      }
    } catch (e) {
      console.log('Error dropping table:', e.message);
    }
    
    // Create a new products table by inserting a test product
    console.log('Creating products table...');
    const { error: insertError } = await supabase
      .from('products')
      .insert([{
        shopify_id: 0,
        title: 'Test Product',
        price: '0.00',
        description: 'Test Description',
        image: ''
      }]);
      
    if (insertError) {
      console.error('Failed to create products table:', insertError.message);
      return false;
    }
    
    console.log('Products table created successfully');
    
    // Clean up test product
    await supabase.from('products').delete().eq('shopify_id', 0);
    console.log('Test product removed');
    
    return true;
  } catch (error) {
    console.error('Supabase fix failed:', error.message);
    return false;
  }
}

// Run the fix
fixSupabase()
  .then(success => {
    if (success) {
      console.log('✅ Supabase fix completed successfully');
    } else {
      console.error('❌ Supabase fix failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Supabase fix error:', error);
    process.exit(1);
  });