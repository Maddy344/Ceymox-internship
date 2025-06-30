# Shopify Low Stock Alert App

A Node.js application that monitors your Shopify store inventory and sends alerts when products are running low on stock.

## Features

- Monitor product inventory levels
- Set custom thresholds for low stock alerts
- Receive email notifications when products are running low
- View low stock items in a dashboard
- Generate daily, weekly, and monthly reports
- Scheduled automatic inventory checks

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Shopify API credentials:
   ```
   SHOPIFY_API_KEY=your_api_key_here
   SHOPIFY_API_SECRET=your_api_secret_here
   SHOP_DOMAIN=your-store.myshopify.com
   ACCESS_TOKEN=your_access_token_here
   USE_MOCK_DATA=false
   HOST=localhost
   PORT=3002
   NOTIFICATION_EMAIL=your-email@example.com
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   ```
4. Start the application:
   ```
   npm start
   ```

## Development

For development with auto-reload:
```
npm run dev
```

## Getting Shopify API Credentials

1. Go to your [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Create a new app
3. Get your API key and API secret key
4. Set up the app URL and redirect URLs

## Getting an Access Token

1. In your Shopify admin, go to "Settings" > "Apps and sales channels"
2. Click on "Develop apps" (or "App development")
3. Create a new app
4. Configure the required scopes (read_products, write_products)
5. Install the app to your store
6. Copy the access token to your .env file

## Email Configuration

For development, the app uses Ethereal Email for testing. In production, you should configure a real SMTP service:

1. Sign up for an SMTP service (SendGrid, Mailgun, etc.)
2. Update the SMTP settings in the .env file
3. Update the email configuration in notificationService.js

## Scheduled Tasks

The app includes the following scheduled tasks:

- Daily inventory check at 9:00 AM
- Weekly summary report on Sunday at 10:00 AM
- Monthly summary report on the 1st of each month at 10:00 AM

## Deployment

### Frontend Deployment

The frontend can be deployed to Vercel or Netlify:

1. Create an account on [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
2. Connect your GitHub repository
3. Configure the build settings
4. Deploy the app

### Backend Deployment

The backend can be deployed to Render, Railway, or Fly.io:

1. Create an account on [Render](https://render.com), [Railway](https://railway.app), or [Fly.io](https://fly.io)
2. Connect your GitHub repository
3. Configure the environment variables
4. Deploy the app

### Environment Variables

Make sure to set the following environment variables in your production environment:

- SHOPIFY_API_KEY
- SHOPIFY_API_SECRET
- SHOP_DOMAIN
- ACCESS_TOKEN
- USE_MOCK_DATA (set to false in production)
- PORT
- NOTIFICATION_EMAIL
- SMTP_USER
- SMTP_PASS

## App Store Listing (Optional)

If you want to publish your app to the Shopify App Store:

1. Create a compelling app listing with screenshots and videos
2. Write a clear description of your app's features and benefits
3. Set up pricing (free or paid)
4. Submit your app for review

## License

This project is licensed under the MIT License - see the LICENSE file for details.