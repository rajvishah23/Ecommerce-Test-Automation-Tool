/**
 * Configuration module for ecommerce test automation
 */

export const defaultConfig = {
  browser: {
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  },
  timeouts: {
    pageLoad: 30000, // 30 seconds
    elementWait: 10000, // 10 seconds
    navigation: 30000
  },
  retry: {
    attempts: 3,
    delay: 2000 // 2 seconds between retries
  },
  errorTolerance: {
    critical: 0, // No critical errors allowed
    warning: 5, // Allow up to 5 warnings
    network: 2 // Allow up to 2 network failures (non-critical)
  },
  selectors: {
    // Common Shopify selectors
    shopify: {
      productTitle: [
        'h1[class*="product"][class*="title"]',   // any h1 containing both "product" and "title" in class
        'h1[data-product*="title"]',              // any h1 with data-product containing "title"
        '*[class*="title"]',               // any element with class containing "product-title"
      ],
      productPrice: [
        '[class*="price"]',                       // any element with class containing "price"
        '[data-product*="price"]',                // any element with data attribute containing "price"
        '.product__price',                         // fallback common Shopify class
        '.price-current'                           // fallback
      ],
      addToCart: [
        'button[name*="add"]',                     // any button with name containing "add"
        'button[type*="submit"]',                  // button type submit
        '[data-testid="pdp-addToBag-submit"]',                // class containing "add-to-cart"
        '[data-add-to-cart]',                       // data attribute containing add-to-cart                              // fallback: first button
      ],
      productDescription: [
        '[class*="description"]',                  // any class containing description
        '[data-product*="description"]',           // data attribute containing description
        '*[class*="rte accordion-content"]',                                    // Shopify rich text
        '[id*="description"]'                      // id containing description
      ],
      productImage: [
        'img[class*="product"]',                   // any img with class containing product
        '[data-product*="image"]',                 // data attribute
        'img[src*="product"]',                     // img with src containing product
        '.product__media img',                      // Shopify fallback
        '.product-single__photo img'
      ],
      productVariant: [
        'select[name*="id"]',
        '[class*="variant-size"]',
        'select[class*="variant"]',                 // class containing variant
        '[data-variant*="select"]',                 // data attribute
        '.product-form__input select'
      ]
    },
    // Common BigCommerce selectors
    bigcommerce: {
      productTitle: ['h1.product-title', 'h1[data-product-title]', '.productView-title', 'h1'],
      productPrice: ['.price', '.product-price', '[data-product-price]', '.productView-price'],
      addToCart: ['button[data-button-type="add-cart"]', 'button.add-to-cart', '[data-product-id] button', 'button[type="submit"]'],
      productDescription: ['.product-description', '[data-product-description]', '.productView-description'],
      productImage: ['img.product-image', '.productView-images img', '[data-product-image]', '.productView-image img'],
      productVariant: ['select[name*="option"]', 'select.product-option', '[data-product-option]']
    }
  }
};

export function mergeConfig(userConfig = {}) {
  return {
    browser: { ...defaultConfig.browser, ...userConfig.browser },
    timeouts: { ...defaultConfig.timeouts, ...userConfig.timeouts },
    retry: { ...defaultConfig.retry, ...userConfig.retry },
    errorTolerance: { ...defaultConfig.errorTolerance, ...userConfig.errorTolerance },
    selectors: { ...defaultConfig.selectors, ...userConfig.selectors }
  };
}

