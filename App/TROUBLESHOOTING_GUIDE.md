# Supabase Integration Troubleshooting Guide

## Problem Identified
Your app is not storing emails in the Supabase database because **critical tables are missing**. The inbox appears empty because the `emails` table doesn't exist in your Supabase database.

## Root Cause
- ✅ Supabase connection is working
- ✅ Basic tables exist: `shops`, `shop_settings`, `stock_logs`
- ❌ Missing critical tables: `emails`, `low_stock_history`, `notification_settings`, `custom_thresholds`

## IMMEDIATE FIX (Required)

### Step 1: Create Missing Tables in Supabase
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `pqifekkoglrgjiiprrlr`
3. Go to **SQL Editor**
4. Copy and paste the entire contents of `SUPABASE_FIX.sql` 
5. Click **Run** to execute the SQL commands

### Step 2: Verify Tables Were Created
Run this command in your project directory:
```bash
node check-tables.js
```

You should see all tables marked with ✅.

### Step 3: Test Email Storage
1. Start your app: `npm start` or `node index.js`
2. Visit: http://localhost:3005/check-low-stock
3. Check the inbox: http://localhost:3005/email-status.html

## What Each Missing Table Does

### `emails` table (CRITICAL)
- **Purpose**: Stores all email notifications sent by the app
- **Impact**: Without this, emails aren't saved to the inbox
- **Used by**: Email Status Checker, Inbox functionality

### `low_stock_history` table
- **Purpose**: Stores historical data for reporting
- **Impact**: Reports won't work properly
- **Used by**: Daily/Weekly/Monthly reports

### `notification_settings` table
- **Purpose**: Stores user preferences for notifications
- **Impact**: Settings may not persist properly
- **Used by**: Settings page, notification preferences

### `custom_thresholds` table
- **Purpose**: Stores custom stock thresholds per product
- **Impact**: Custom thresholds won't be saved
- **Used by**: Product-specific threshold management

## Verification Steps

### 1. Check Database Connection
```bash
node test-supabase.js
```

### 2. Check Table Status
```bash
node check-tables.js
```

### 3. Test Email Flow
1. Trigger low stock check: `/check-low-stock`
2. Check console logs for "Email saved to Supabase successfully"
3. Visit inbox: `/email-status.html`

## Common Issues After Fix

### Issue: Still no emails in inbox
**Solution**: 
1. Clear browser cache
2. Check console logs for errors
3. Verify email settings in app

### Issue: Database connection errors
**Solution**:
1. Verify Supabase URL and key in `.env`
2. Check Supabase project status
3. Ensure tables have proper permissions

### Issue: Emails saved but not displaying
**Solution**:
1. Check browser console for JavaScript errors
2. Verify API endpoint `/api/emails` returns data
3. Clear localStorage: `localStorage.clear()`

## Testing Commands

```bash
# Test Supabase connection
node test-supabase.js

# Check which tables exist
node check-tables.js

# Start the app
node index.js

# Test low stock check (in browser)
http://localhost:3005/check-low-stock

# Check inbox (in browser)
http://localhost:3005/email-status.html
```

## Expected Behavior After Fix

1. **Low Stock Check**: Should save emails to both file system AND Supabase
2. **Inbox**: Should display emails from Supabase database
3. **Settings**: Should persist in Supabase
4. **Reports**: Should work with historical data
5. **Console Logs**: Should show "Email saved to Supabase successfully"

## Files Modified for Better Error Handling
- `database.js`: Added detailed error logging
- `SUPABASE_FIX.sql`: Complete table creation script
- `check-tables.js`: Table verification script

## Next Steps After Running SQL Fix
1. Run the SQL commands in Supabase dashboard
2. Restart your application
3. Test the low stock check functionality
4. Verify emails appear in the inbox
5. Check console logs for any remaining errors

The main issue was simply missing database tables. Once you run the SQL commands in your Supabase dashboard, your app should start storing emails properly and the inbox will show the low stock alerts.