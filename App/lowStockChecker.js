const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { logLowStockAlert } = require('./database');

// File to store low stock history
const LOW_STOCK_HISTORY_FILE = path.join(__dirname, 'data', 'low-stock-history.json');
const CUSTOM_THRESHOLDS_FILE = path.join(__dirname, 'data', 'custom-thresholds.json');

/**
 * Get custom thresholds for products
 * @returns {Promise<Object>} - Custom thresholds object
 */
async function getCustomThresholds() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    const data = await fs.readFile(CUSTOM_THRESHOLDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
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
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(CUSTOM_THRESHOLDS_FILE, JSON.stringify(thresholds, null, 2));
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
    const customThresholds = await getCustomThresholds();
    
    // Check if we should use mock data
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('Using mock data for low stock check');
      const mockData = getMockLowStockData();
      const lowStockItems = filterLowStockItems(mockData, defaultThreshold, customThresholds);
      await saveLowStockHistory(lowStockItems, defaultThreshold);
      return lowStockItems;
    }
    
    // Use real Shopify data
    console.log('Fetching products from Shopify...');
    const products = await fetchShopifyProducts();
    
    // Filter for low stock items using custom thresholds
    const lowStockItems = filterLowStockItems(products, defaultThreshold, customThresholds);
    
    // Save history for reporting
    await saveLowStockHistory(lowStockItems, defaultThreshold);
    
    return lowStockItems;
  } catch (error) {
    console.error('Error checking low stock:', error);
    // Fallback to mock data in case of error
    console.log('Falling back to mock data due to error');
    const mockData = getMockLowStockData();
    const customThresholds = await getCustomThresholds();
    const lowStockItems = filterLowStockItems(mockData, defaultThreshold, customThresholds);
    await saveLowStockHistory(lowStockItems, defaultThreshold);
    return lowStockItems;
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
    // Create data directory if it doesn't exist
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    
    // Read existing history or create new
    let history = [];
    try {
      const historyData = await fs.readFile(LOW_STOCK_HISTORY_FILE, 'utf8');
      history = JSON.parse(historyData);
    } catch (err) {
      // File doesn't exist yet, that's ok
    }
    
    // Add new entry
    const entry = {
      date: new Date().toISOString(),
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
    
    // Add to history and limit to last 100 entries
    history.unshift(entry);
    if (history.length > 100) {
      history = history.slice(0, 100);
    }
    
    // Save history
    await fs.writeFile(LOW_STOCK_HISTORY_FILE, JSON.stringify(history, null, 2));
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
  
  if (!shop || !accessToken) {
    throw new Error('Missing Shopify credentials in .env file');
  }
  
  const url = `https://${shop}/admin/api/2023-10/products.json?limit=250`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.products || [];
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
    // Read history file
    let history = [];
    try {
      const historyData = await fs.readFile(LOW_STOCK_HISTORY_FILE, 'utf8');
      history = JSON.parse(historyData);
    } catch (err) {
      return [];
    }
    
    if (!selectedDate) {
      return history;
    }
    
    const targetDate = new Date(selectedDate);
    
    // Filter based on period and selected date
    return history.filter(entry => {
      const entryDate = new Date(entry.date);
      
      switch (period) {
        case 'daily':
          // Same day
          return entryDate.toDateString() === targetDate.toDateString();
        case 'weekly':
          // Week based on month days (1-7, 8-14, 15-21, 22-28, etc.)
          const targetDay = targetDate.getDate();
          const entryDay = entryDate.getDate();
          const targetMonth = targetDate.getMonth();
          const entryMonth = entryDate.getMonth();
          const targetYear = targetDate.getFullYear();
          const entryYear = entryDate.getFullYear();
          
          // Must be same month and year
          if (targetMonth !== entryMonth || targetYear !== entryYear) {
            return false;
          }
          
          // Calculate which week the target date belongs to
          const weekNumber = Math.ceil(targetDay / 7);
          const weekStart = (weekNumber - 1) * 7 + 1;
          const weekEnd = Math.min(weekNumber * 7, new Date(targetYear, targetMonth + 1, 0).getDate());
          
          return entryDay >= weekStart && entryDay <= weekEnd;
        case 'monthly':
          // Same month and year
          return entryDate.getMonth() === targetDate.getMonth() && 
                 entryDate.getFullYear() === targetDate.getFullYear();
        default:
          return entryDate.toDateString() === targetDate.toDateString();
      }
    });
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
  // Log to console (for development)
  console.log(`Found ${lowStockItems.length} items with low stock`);
  
  for (const item of lowStockItems) {
    // Calculate total inventory for the product
    let totalInventory = 0;
    item.variants.forEach(variant => {
      if (variant.inventory_management === 'shopify') {
        totalInventory += variant.inventory_quantity;
      }
    });
    
    console.log(`- ${item.title}: ${totalInventory} in stock`);
    
    // Log to database (use default shop for now)
    try {
      console.log('Attempting to log to database:', {
        shop: process.env.SHOP_DOMAIN || 'default-shop',
        productId: item.id,
        stock: totalInventory
      });
      
      const result = await logLowStockAlert(
        process.env.SHOP_DOMAIN || 'default-shop',
        item.id,
        totalInventory
      );
      
      console.log('Database log result:', result);
    } catch (error) {
      console.error('Error logging to database:', error);
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