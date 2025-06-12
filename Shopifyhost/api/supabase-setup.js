// supabase-setup.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client with fallback values
const supabase = createClient(
  process.env.SUPABASE_URL || "https://ojeipoemzriiykfajkdh.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZWlwb2VtenJpaXlrZmFqa2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzI1MjQsImV4cCI6MjA2NTIwODUyNH0.jy5vWZ-V1QoabyrYQSsr5gp3HOu0hD7PMJWK1BVA09Y"
);

async function setupSupabaseTable() {
  try {
    console.log('Setting up Supabase products table...');
    
    // Check if table exists
    const { error: checkError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
      
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Products table does not exist, creating it...');
      
      // Create the products table
      const { error: createError } = await supabase
        .from('products')
        .insert([{
          shopify_id: 0,
          title: 'Test Product',
          price: '0.00',
          description: 'Test Description',
          image: ''
        }]);
        
      if (createError && !createError.message.includes('already exists')) {
        console.error('Failed to create products table:', createError.message);
        return false;
      }
      
      console.log('Products table created via insert');
      
      // Clean up test product
      await supabase.from('products').delete().eq('shopify_id', 0);
    } else {
      console.log('Products table already exists');
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