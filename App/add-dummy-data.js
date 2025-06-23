// Add dummy data to Supabase tables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://pqifekkoglrgjiiprrlr.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaWZla2tvZ2xyZ2ppaXBycmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDI3NzcsImV4cCI6MjA2NTk3ODc3N30.uCTd36g0DaINiEq-7do_OO0tdhGvVnr_J7yArnN7Alk';

async function addDummyData() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Add dummy notification_settings
    await supabase.from('notification_settings').upsert({
      shop_domain: 'DUMMY_SHOP',
      email: 'dummy@example.com',
      disable_email: false,
      disable_dashboard: false,
      default_threshold: 5,
      enable_auto_check: true
    });
    
    // Add dummy custom_thresholds
    await supabase.from('custom_thresholds').upsert({
      shop_domain: 'DUMMY_SHOP',
      product_id: 'DUMMY_PRODUCT',
      threshold: 10
    });
    
    // Add dummy emails
    await supabase.from('emails').upsert({
      shop_domain: 'DUMMY_SHOP',
      subject: 'Dummy Email',
      from_address: 'dummy@example.com',
      to_address: 'dummy@example.com',
      html_content: '<p>Dummy email content</p>',
      read: false
    });
    
    console.log('Dummy data added successfully');
  } catch (error) {
    console.error('Error adding dummy data:', error);
  }
}

addDummyData();