/**
 * lowStockChecker.js  —  SQL storage version (Aiven MySQL)
 * --------------------------------------------------------
 * Pass the MySQL pool (`db`) in once; all reads/writes now
 * hit the custom_thresholds and low_stock_history tables.
 */

module.exports = (db) => {
  console.log('USE_MOCK_DATA:', process.env.USE_MOCK_DATA);
  const fetch = require('node-fetch');

  // ---- safeFetch helper ----------------------------------
async function safeFetch(url, token) {
  try {
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Shopify request failed:', { url, status: res.status, body: body.slice(0, 500) });
      throw new Error(`Shopify API ${res.status}`);
    }

    return res.json();
  } catch (err) {
    console.error('Network/parse error for', url, err.message);
    throw err;
  }
}

  // ───────────────────────────────────────────────────────
  // thresholds (SQL)
  // ───────────────────────────────────────────────────────
  async function getCustomThresholds() {
    const [rows] = await db.query(
      'SELECT product_id, threshold FROM custom_thresholds'
    );
    const obj = {};
    rows.forEach(r => { obj[r.product_id] = r.threshold; });
    return obj;
  }

  async function saveCustomThresholds(thresholds) {
    try {
      const entries = Object.entries(thresholds); // [[id,thr], …]
      if (entries.length === 0) return true;

      // build one bulk INSERT … ON DUPLICATE KEY UPDATE …
      const values = entries.map(() => '(?, ?)').join(',');
      const params = entries.flat();

      const sql =
        `INSERT INTO custom_thresholds (product_id, threshold)
         VALUES ${values}
         ON DUPLICATE KEY UPDATE threshold = VALUES(threshold)`;

      await db.query(sql, params);
      return true;
    } catch (err) {
      console.error('saveCustomThresholds:', err);
      return false;
    }
  }

  // ───────────────────────────────────────────────────────
  // main checker
  // ───────────────────────────────────────────────────────
  async function checkLowStock(defaultThreshold = 5) {
    try {
      const customThresholds = await getCustomThresholds();

      const products =
        process.env.USE_MOCK_DATA === 'true'
          ? getMockLowStockData()
          : await fetchShopifyProducts();

      const low = filterLowStockItems(
        products,
        defaultThreshold,
        customThresholds
      );

      await saveLowStockHistory(low, defaultThreshold);
      return low;
    } catch (err) {
      console.error('checkLowStock:', err);
      return [];
    }
  }

function filterLowStockItems(products, defaultT, customT) {
  return products.filter(p => {
    const t   = customT[p.id] ?? defaultT;
    const qty = (Array.isArray(p.variants) ? p.variants : [])
                .reduce((s, v) => s + (v.inventory_quantity ?? 0), 0);
    return qty <= t;
  });
}

  // ───────────────────────────────────────────────────────
  // history (SQL)
  // ───────────────────────────────────────────────────────
  async function saveLowStockHistory(items, threshold) {
    try {
      await db.query(
        `INSERT INTO low_stock_history (date, threshold, item_count, items)
         VALUES (NOW(), ?, ?, ?)`,
        [threshold, items.length, JSON.stringify(items)]
      );
    } catch (err) {
      console.error('saveLowStockHistory:', err);
    }
  }

  async function getLowStockHistory(period = 'daily', selectedDate = null) {
    try {
      if (!selectedDate) {
        // no filter – return everything
        const [rows] = await db.query('SELECT * FROM low_stock_history');
        return rows.map(r => ({
              ...r,
              itemCount: r.item_count,
              items:
              typeof r.items === 'string' ? JSON.parse(r.items) : r.items   // parse only if it’s a JSON string
        }));
      }

      const date = new Date(selectedDate);
      let sql   = '';
      let args  = [];

      switch (period) {
        case 'daily':
          sql  = `SELECT * FROM low_stock_history
                  WHERE DATE(date) = ?`;
          args = [date.toISOString().split('T')[0]];
          break;

        case 'weekly': {
          const start = new Date(date);
          start.setDate(date.getDate() - date.getDay()); // Sunday
          const end = new Date(start);
          end.setDate(start.getDate() + 6);               // Saturday
          sql  = `SELECT * FROM low_stock_history
                  WHERE date BETWEEN ? AND ?`;;
          args = [start.toISOString().split('T')[0], end.toISOString().split('T')[0]];
          break;
        }

        case 'monthly':
          sql = `SELECT * FROM low_stock_history
                 WHERE YEAR(date)  = ?
                 AND MONTH(date) = ?`;
          args = [date.getFullYear(), date.getMonth() + 1];
          break;

        default:
          sql  = `SELECT * FROM low_stock_history
                  WHERE DATE(date) = ?`;
          args = [date.toISOString().split('T')[0]];
      }

      console.log('SQL:', sql);
      console.log('Args:', args);

      const [rows] = await db.query(sql, args);
      return rows.map(r => ({
              ...r,
              itemCount: r.item_count,
              items:
              typeof r.items === 'string' ? JSON.parse(r.items) : r.items   // parse only if it’s a JSON string
      }));
    } catch (err) {
      console.error('getLowStockHistory:', err);
      return [];
    }
  }

  // ───────────────────────────────────────────────────────
  // notifications (console)
  // ───────────────────────────────────────────────────────
  function sendLowStockNotifications(items) {
  console.log(`Found ${items.length} low-stock items`);

  items.forEach(item => {
    const qty = (Array.isArray(item.variants) ? item.variants : [])
      .reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0);

    console.log(`- ${item.title}: ${qty} left`);
  });
}


  // ───────────────────────────────────────────────────────
  // product helpers
  // ───────────────────────────────────────────────────────
  async function fetchShopifyProducts() {
  const shop = process.env.SHOP_DOMAIN;
  const token = process.env.ACCESS_TOKEN;
  if (!shop || !token) throw new Error('Missing Shopify creds');

  // Step 1: Fetch products
  const productUrl = `https://${shop}/admin/api/2025-07/products.json?limit=250&fields=id,title,variants`;
  const { products = [] } = await safeFetch(productUrl, token);

  // Step 2: Collect all inventory_item_ids
  const inventoryItemIds = products.flatMap(p => 
    Array.isArray(p.variants) ? p.variants.map(v => v.inventory_item_id).filter(Boolean) : []
  );

  console.log('Collected inventory_item_ids:', inventoryItemIds.slice(0, 10), 'total =', inventoryItemIds.length);

  // Step 3: Fetch inventory levels in batches of ≤ 50
  const inventoryMap = {};
  const chunkSize = 50;

  for (let i = 0; i < inventoryItemIds.length; i += chunkSize) {
    const slice = inventoryItemIds.slice(i, i + chunkSize).join(',');
    const inventoryLevelsUrl =
      `https://${shop}/admin/api/2025-07/inventory_levels.json?inventory_item_ids=${slice}`;

    const { inventory_levels = [] } = await safeFetch(inventoryLevelsUrl, token);
    inventory_levels.forEach(lvl => {
      inventoryMap[lvl.inventory_item_id] = lvl.available;
    });
  }

  // Step 5: Merge available quantity back into products
  products.forEach(p => {
    if (Array.isArray(p.variants)) {
      p.variants.forEach(v => {
        v.inventory_quantity = inventoryMap[v.inventory_item_id] ?? 0;
      });
    }
  });

  return products;
}

  // lowStockChecker.js  (top, after fetchShopifyProducts)
async function fetchInventoryLevels(ids, shop, token) {
  const chunk = 250;
  const map   = {};

  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk).join(',');
    const url   = `https://${shop}/admin/api/2025-07/inventory_levels.json?inventory_item_ids=${slice}`;
    const res   = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
    });

    const { inventory_levels } = await res.json();
    console.log('✔ Inventory response sample:', inventory_levels.slice(0, 3));
    inventory_levels.forEach(lvl => {
      map[lvl.inventory_item_id] = (map[lvl.inventory_item_id] || 0) + lvl.available;
    });
  }

  return map;   // ← return after the loop, not inside it
}



  function getMockLowStockData() {
    return [
      {
        id: '123',
        title: 'T-Shirt',
        variants: [
          { id: 'v1', inventory_quantity: 3, inventory_management: 'shopify' }
        ]
      }
    ];
  }

  async function getAllProducts() {
    try {
      return process.env.USE_MOCK_DATA === 'true'
        ? getMockLowStockData()
        : await fetchShopifyProducts();
    } catch (err) {
      console.error('getAllProducts:', err);
      return getMockLowStockData();
    }
  }

  // ───────────────────────────────────────────────────────
  // public API
  // ───────────────────────────────────────────────────────
  return {
    checkLowStock,
    sendLowStockNotifications,
    getLowStockHistory,
    getCustomThresholds,
    saveCustomThresholds,
    getAllProducts
  };
};
