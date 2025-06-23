// Initialize Supabase tables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Hardcoded Supabase credentials as fallback
const HARDCODED_SUPABASE_URL = 'https://pqifekkoglrgjiiprrlr.supabase.co';
const HARDCODED_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaWZla2tvZ2xyZ2ppaXBycmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDI3NzcsImV4cCI6MjA2NTk3ODc3N30.uCTd36g0DaINiEq-7do_OO0tdhGvVnr_J7yArnN7Alk';

// Get Supabase credentials from environment or use hardcoded values
const supabaseUrl = process.env.SUPABASE_URL || HARDCODED_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || HARDCODED_SUPABASE_KEY;

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