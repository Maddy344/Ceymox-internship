# Shopify Low Stock Alert App - Deployment Guide

## Step 1: Set up Supabase Database

1. Go to [Supabase](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase-schema.sql`
3. Go to Settings > API to get your:
   - Project URL
   - Anon public key
4. Update your `.env` file with these values

## Step 2: Deploy Backend to Render

1. Push your code to GitHub
2. Go to [Render](https://render.com) and create a new Web Service
3. Connect your GitHub repository
4. Set the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add all environment variables from your `.env` file
6. Deploy and get your HTTPS URL

## Step 3: Update Environment Variables

Update your `.env` and Render environment variables:
```
HOST=https://your-app-name.onrender.com
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Create Shopify App in Partner Dashboard

1. Go to [Shopify Partners](https://partners.shopify.com)
2. Create a new app → Public App
3. Fill in:
   - **App Name**: Low Stock Alert App
   - **App URL**: `https://your-app-name.onrender.com`
   - **Allowed redirection URL(s)**: `https://your-app-name.onrender.com/auth/callback`
   - **Webhook URL**: `https://your-app-name.onrender.com/webhooks/app/uninstalled`
4. Set scopes: `read_products`, `read_inventory`
5. Make it an **Unlisted App**

## Step 5: Test Installation

1. Get the installation URL from Partner Dashboard
2. Install on a development store
3. Test all functionality:
   - OAuth flow
   - Settings saving
   - Stock checking
   - Email notifications
   - Cron jobs

## Step 6: Submit for Review

1. Add app listing information:
   - Description
   - Screenshots
   - App icon (1200x1200)
   - Privacy policy
   - Support email
2. Submit for Shopify review
3. Fix any feedback and resubmit

## Environment Variables Needed

```
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
HOST=https://your-app-name.onrender.com
PORT=3005
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NOTIFICATION_EMAIL=your_email@gmail.com
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

## Features Included

✅ OAuth authentication
✅ Database integration (Supabase)
✅ Cron jobs for daily checks
✅ Email notifications
✅ Uninstall webhook
✅ Settings management
✅ Stock monitoring
✅ Report generation
✅ Inbox system

## Next Steps After Deployment

1. The app will run cron jobs automatically
2. Daily stock checks at 9:00 AM
3. Weekly reports on Sundays at 10:00 AM
4. Monthly reports on 1st of each month at 10:00 AM
5. All data stored securely in Supabase