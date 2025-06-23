// Test direct insert to Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pqifekkoglrgjiiprrlr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaWZla2tvZ2xyZ2ppaXBycmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDI3NzcsImV4cCI6MjA2NTk3ODc3N30.uCTd36g0DaINiEq-7do_OO0tdhGvVnr_J7yArnN7Alk';

async function testInsert() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // First insert to shops
    const { data: data1, error: error1 } = await supabase
      .from('shops')
      .upsert({
        shop_domain: 'DUMMY_SHOP',
        access_token: 'dummy_token'
      })
      .select();
    
    console.log('Shops:', error1 ? error1.message : `SUCCESS - ${data1?.length || 0} rows`);
    
    // Then insert to shop_settings
    const { data: data2, error: error2 } = await supabase
      .from('shop_settings')
      .upsert({
        shop_domain: 'DUMMY_SHOP',
        email: 'dummy@example.com',
        threshold: 5
      })
      .select();
    
    console.log('Settings:', error2 ? error2.message : `SUCCESS - ${data2?.length || 0} rows`);
    
    // Then insert to stock_logs
    const { data: data3, error: error3 } = await supabase
      .from('stock_logs')
      .insert({
        shop_domain: 'DUMMY_SHOP',
        product_id: 'DUMMY_PRODUCT',
        stock_quantity: 5
      })
      .select();
    
    console.log('Stock logs:', error3 ? error3.message : `SUCCESS - ${data3?.length || 0} rows`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testInsert();