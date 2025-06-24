const prisma = require('./prisma-client');

// OAuth Routes for Shopify App
function setupOAuthRoutes(app) {
  
  app.get('/auth', (req, res) => {
    const shop = req.query.shop;
    
    if (!shop) {
      return res.status(400).send('Missing shop parameter');
    }
    
    const scopes = 'read_products,read_inventory';
    const redirectUri = `${process.env.HOST || 'https://ceymox-internship-low-stock-alert-a.vercel.app'}/auth/callback`;
    const clientId = process.env.SHOPIFY_API_KEY;
    
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${shop}`;
    
    res.redirect(authUrl);
  });

  app.get('/auth/callback', async (req, res) => {
    const { code, state: shop } = req.query;
    
    if (!code || !shop) {
      return res.status(400).send('Missing required parameters');
    }
    
    try {
      // Exchange code for access token
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        // Save shop data to database (implement if needed)
        console.log(`Shop ${shop} authenticated with token`);
        
        // Redirect to app dashboard
        res.redirect(`/?shop=${shop}`);
      } else {
        res.status(400).send('Failed to get access token');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send('OAuth failed');
    }
  });

  // Webhook for app uninstall
  app.post('/webhooks/app/uninstalled', async (req, res) => {
    try {
      const shop = req.get('X-Shopify-Shop-Domain');
      
      if (shop) {
        // Remove shop data (implement if needed)
        console.log(`App uninstalled from ${shop}`);
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Uninstall webhook error:', error);
      res.status(500).send('Error');
    }
  });
}

module.exports = { setupOAuthRoutes };