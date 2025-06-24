const fetch = require('node-fetch');
const prisma = require('./prisma-client');

/**
 * Get custom thresholds for products
 * @returns {Promise<Object>} - Custom thresholds object
 */
async function getCustomThresholds() {
  try {
    const thresholds = await prisma.customThreshold.findMany();
    const thresholdMap = {};
    thresholds.forEach(t => {
      thresholdMap[t.productId] = t.threshold;
    });
    console.log('Retrieved custom thresholds from database:', thresholdMap);
    return thresholdMap;
  } catch (error) {
    console.error('Error getting custom thresholds:', error);
    return {};
  }
}

/**
 * Save custom thresholds for products
 * @param {Object} thresholds - Custom thresholds object
 * @returns {Promise<boolean>} - Success status
 */
async function saveCustomThresholds(thresholds) {
  try {
    await prisma.customThreshold.deleteMany();
    const data = Object.entries(thresholds).map(([productId, threshold]) => ({
      productId,
      threshold: parseInt(threshold)
    }));
    await prisma.customThreshold.createMany({ data });
    console.log('Saved custom thresholds to database');
    return true;
  } catch (error) {
    console.error('Error saving custom thresholds:', error);
    return false;
  }
}

/**
 * Check for products with low stock using custom thresholds
 * @param {number} defaultThreshold - The default stock threshold
 * @returns {Promise<Array>} - Array of products with low stock
 */
async function checkLowStock(defaultThreshold = 5) {
  try {
    console.log('🔍 Starting low stock check with threshold:', defaultThreshold);
    const customThresholds = await getCustomThresholds();
    
    // Try real Shopify data first
    console.log('🛍️ Fetching products from Shopify...');
    const products = await fetchShopifyProducts();
    
    if (!products || products.length === 0) {
      console.log('⚠️ No products returned from Shopify, using mock data');
      const mockData = getMockLowStockData();
      const lowStockItems = filterLowStockItems(mockData, defaultThreshold, customThresholds);
      await saveLowStockHistory(lowStockItems, defaultThreshold);
      return lowStockItems;
    }
    
    // Filter for low stock items using custom thresholds
    const lowStockItems = filterLowStockItems(products, defaultThreshold, customThresholds);
    
    // Save history for reporting
    await saveLowStockHistory(lowStockItems, defaultThreshold);
    
    return lowStockItems;
  } catch (error) {
    console.error('❌ Error checking low stock:', error.message);
    
    // Fallback to mock data in case of error
    console.log('🔄 Falling back to mock data due to error');
    try {
      const mockData = getMockLowStockData();
      const customThresholds = await getCustomThresholds();
      const lowStockItems = filterLowStockItems(mockData, defaultThreshold, customThresholds);
      await saveLowStockHistory(lowStockItems, defaultThreshold);
      return lowStockItems;
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError);
      throw new Error('Both Shopify API and fallback failed');
    }
  }
}

/**
 * Filter products for low stock using custom thresholds
 * @param {Array} products - Array of products
 * @param {number} defaultThreshold - Default threshold
 * @param {Object} customThresholds - Custom thresholds object
 * @returns {Array} - Filtered low stock items
 */
function filterLowStockItems(products, defaultThreshold, customThresholds) {
  console.log('Custom thresholds:', customThresholds);
  
  return products.filter(product => {
    // Get threshold for this product (custom or default)
    const threshold = customThresholds[product.id] || defaultThreshold;
    
    // Calculate total inventory
    let totalInventory = 0;
    product.variants.forEach(variant => {
      if (variant.inventory_management === 'shopify') {
        totalInventory += variant.inventory_quantity;
      }
    });
    
    const isLowStock = totalInventory <= threshold;
    console.log(`Product: ${product.title}, Stock: ${totalInventory}, Threshold: ${threshold}, Low Stock: ${isLowStock}`);
    
    return isLowStock;
  });
}

/**
 * Save low stock history for reporting
 * @param {Array} lowStockItems - Low stock items
 * @param {number} threshold - The threshold used
 */
async function saveLowStockHistory(lowStockItems, threshold) {
  try {
    const entry = {
      date: new Date(),
      threshold,
      itemCount: lowStockItems.length,
      items: lowStockItems.map(item => ({
        id: item.id,
        title: item.title,
        lowStockVariants: item.variants
          .filter(v => v.inventory_quantity <= threshold)
          .map(v => ({
            id: v.id,
            title: v.title,
            inventory_quantity: v.inventory_quantity
          }))
      }))
    };
    
    await prisma.lowStockHistory.create({ data: entry });
    console.log('Low stock history saved to database');
  } catch (error) {
    console.error('Error saving low stock history:', error);
  }
}

/**
 * Fetch products from Shopify
 * @returns {Promise<Array>} - Array of products
 */
async function fetchShopifyProducts() {
  const shop = process.env.SHOP_DOMAIN;
  const accessToken = process.env.ACCESS_TOKEN;
  
  console.log('🛍️ Fetching from Shopify:', shop ? 'configured' : 'missing');
  
  if (!shop || !accessToken) {
    console.error('❌ Missing Shopify credentials');
    throw new Error('Missing Shopify credentials');
  }
  
  const url = `https://${shop}/admin/api/2023-10/products.json?limit=250`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Shopify API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Shopify API error:', response.status, errorText);
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Fetched', data.products?.length || 0, 'products from Shopify');
    return data.products || [];
  } catch (error) {
    console.error('❌ Error fetching from Shopify:', error.message);
    throw error;
  }
}

/**
 * Get mock low stock data for testing
 * @returns {Array} - Mock low stock items
 */
function getMockLowStockData() {
  return [
    {
      id: '123456789',
      title: 'T-Shirt',
      handle: 't-shirt',
      variants: [
        {
          id: '987654321',
          inventory_quantity: 3,
          inventory_management: 'shopify'
        },
        {
          id: '987654322',
          inventory_quantity: 1,
          inventory_management: 'shopify'
        }
      ]
    },
    {
      id: '223456789',
      title: 'Jeans',
      handle: 'jeans',
      variants: [
        {
          id: '887654321',
          inventory_quantity: 2,
          inventory_management: 'shopify'
        }
      ]
    },
    {
      id: '323456789',
      title: 'Hoodie',
      handle: 'hoodie',
      variants: [
        {
          id: '787654321',
          inventory_quantity: 4,
          inventory_management: 'shopify'
        }
      ]
    }
  ];
}

/**
 * Get low stock history for reporting
 * @param {string} period - 'daily', 'weekly', or 'monthly'
 * @param {string} selectedDate - Selected date for filtering
 * @returns {Promise<Array>} - History data
 */
async function getLowStockHistory(period = 'daily', selectedDate = null) {
  try {
    let whereClause = {};
    
    if (selectedDate) {
      const targetDate = new Date(selectedDate);
      
      switch (period) {
        case 'daily':
          const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
          const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
          whereClause.date = { gte: startOfDay, lte: endOfDay };
          break;
        case 'weekly':
          const startOfWeek = new Date(targetDate);
          startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          whereClause.date = { gte: startOfWeek, lte: endOfWeek };
          break;
        case 'monthly':
          const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
          const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
          whereClause.date = { gte: startOfMonth, lte: endOfMonth };
          break;
      }
    }
    
    const history = await prisma.lowStockHistory.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });
    
    return history;
  } catch (error) {
    console.error('Error getting low stock history:', error);
    return [];
  }
}

/**
 * Send notifications for low stock items
 * @param {Array} lowStockItems - Array of products with low stock
 */
async function sendLowStockNotifications(lowStockItems) {
  console.log(`📦 Processing ${lowStockItems.length} low stock items for notifications`);
  
  for (const item of lowStockItems) {
    let totalInventory = 0;
    item.variants.forEach(variant => {
      if (variant.inventory_management === 'shopify') {
        totalInventory += variant.inventory_quantity;
      }
    });
    
    console.log(`- ${item.title}: ${totalInventory} in stock`);
    
    // Save individual product alert to emails table
    try {
      const emailRecord = {
        subject: `Low Stock Alert: ${item.title}`,
        fromEmail: 'Low Stock Alert <alerts@lowstockalert.com>',
        toEmail: 'vampirepes24@gmail.com',
        html: `<h3>Low Stock Alert</h3><p><strong>${item.title}</strong> is running low with only <strong>${totalInventory}</strong> items in stock.</p>`,
        read: false
      };
      
      await prisma.emailLog.create({ data: emailRecord });
      console.log(`📧 Email record saved for ${item.title}`);
    } catch (error) {
      console.error('Error saving email record:', error);
    }
  }
}

/**
 * Get all products for threshold management
 * @returns {Promise<Array>} - Array of all products
 */
async function getAllProducts() {
  try {
    // Check if we should use mock data
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('Using mock data for all products');
      return getMockLowStockData();
    }
    
    // Use real Shopify data
    console.log('Fetching all products from Shopify...');
    return await fetchShopifyProducts();
  } catch (error) {
    console.error('Error getting all products:', error);
    // Fallback to mock data in case of error
    console.log('Falling back to mock data due to error');
    return getMockLowStockData();
  }
}

module.exports = {
  checkLowStock,
  sendLowStockNotifications,
  getLowStockHistory,
  getCustomThresholds,
  saveCustomThresholds,
  getAllProducts
};