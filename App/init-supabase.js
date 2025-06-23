// Initialize Supabase tables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function initializeSupabase() {
  console.log('Initializing Supabase tables...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create notification_settings table if it doesn't exist
    const { error: notificationError } = await supabase.rpc('create_notification_settings_if_not_exists');
    if (notificationError) {
      console.error('Error creating notification_settings table:', notificationError);
    } else {
      console.log('notification_settings table created or already exists');
    }
    
    // Create custom_thresholds table if it doesn't exist
    const { error: thresholdsError } = await supabase.rpc('create_custom_thresholds_if_not_exists');
    if (thresholdsError) {
      console.error('Error creating custom_thresholds table:', thresholdsError);
    } else {
      console.log('custom_thresholds table created or already exists');
    }
    
    // Create emails table if it doesn't exist
    const { error: emailsError } = await supabase.rpc('create_emails_if_not_exists');
    if (emailsError) {
      console.error('Error creating emails table:', emailsError);
    } else {
      console.log('emails table created or already exists');
    }
    
    console.log('Supabase initialization complete');
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
}

// Run the initialization
initializeSupabase();