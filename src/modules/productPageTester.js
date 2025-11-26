/**
 * Product Page Testing Module
 * Validates critical product page elements and functionality
 */

import chalk from 'chalk';

export class ProductPageTester {
  constructor(page, config, platform = 'shopify') {
    this.page = page;
    this.config = config;
    this.platform = platform.toLowerCase();
    this.selectors = config.selectors[this.platform] || config.selectors.shopify;
    this.results = {
      passed: true,
      errors: [],
      warnings: [],
      elements: {}
    };
  }

  /**
   * Run all product page tests
   */
  async test() {
    console.log(chalk.blue('\n📦 Testing Product Page Elements...'));

    // Wait for page to be fully loaded
    await this.waitForPageLoad();

    // Test critical elements
    await this.testProductTitle();
    await this.testProductPrice();
    await this.testProductDescription();
    await this.testAddToCartButton();
    await this.testProductImages();
    await this.testProductVariants();
    await this.testMetaInformation();

    // Determine overall result
    this.results.passed = this.results.errors.length === 0;

    return this.results;
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    try {
      // Wait for page load event
      await this.page.evaluate(() => {
        return new Promise((resolve) => {
          if (document.readyState === 'complete') {
            setTimeout(resolve, 1000);
          } else {
            window.addEventListener('load', () => setTimeout(resolve, 1000));
          }
        });
      });
      
      // Wait for network idle by checking for no new requests
      let networkIdle = false;
      const startTime = Date.now();
      const maxWait = Math.min(this.config.timeouts.pageLoad, 10000); // Max 10s for network idle check
      
      while (!networkIdle && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 500));

        networkIdle = await this.page.evaluate(() => {
          // Check if all resources have finished loading
          const resources = performance.getEntriesByType('resource');
          if (resources.length === 0) return true;
          return resources.every(resource => resource.responseEnd > 0);
        });
      }
    } catch (error) {
      this.results.warnings.push({
        type: 'page_load',
        message: 'Page did not reach networkidle state within timeout',
        error: error.message
      });
    }

    // Additional wait for common ecommerce frameworks
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Test product title presence
   */
  async testProductTitle() {
    console.log(chalk.gray('  ✓ Checking product title...'));
    
    let titleFound = false;
    let titleText = '';

    for (const selector of this.selectors.productTitle) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          titleText = await this.page.evaluate(el => el.textContent?.trim(), element);
          if (titleText && titleText.length > 0) {
            titleFound = true;
            this.results.elements.title = {
              found: true,
              selector: selector,
              text: titleText
            };
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (!titleFound) {
      this.results.errors.push({
        type: 'critical',
        element: 'product_title',
        message: 'Product title not found on page',
        selectors: this.selectors.productTitle
      });
      this.results.elements.title = { found: false };
    }
  }

  /**
   * Test product price display
   */
  async testProductPrice() {
    console.log(chalk.gray('  ✓ Checking product price...'));
  
    let priceFound = false;
    let priceText = '';
    const selectors = this.selectors.productPrice || ['[data-testid="product-price"]', '.price', '[data-price]'];
  
    for (const selector of selectors) {
      try {
        // Wait for the element to appear for max 10s
        const element = await this.page.waitForSelector(selector, { timeout: 10000 });
        if (element) {
          priceText = await this.page.evaluate(el => el.textContent?.trim(), element);
          if (priceText && (/\$|€|£|¥|\d/.test(priceText))) {
            priceFound = true;
            this.results.elements.price = {
              found: true,
              selector: selector,
              text: priceText
            };
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
  
    if (!priceFound) {
      this.results.errors.push({
        type: 'critical',
        element: 'product_price',
        message: 'Product price not found on page',
        selectors
      });
      this.results.elements.price = { found: false };
    }
  }
  
  /**
   * Test product description
   */
  async testProductDescription() {
    console.log(chalk.gray('  ✓ Checking product description...'));
    
    let descriptionFound = false;
    let descriptionText = '';

    for (const selector of this.selectors.productDescription) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          descriptionText = await this.page.evaluate(el => el.textContent?.trim(), element);
          if (descriptionText && descriptionText.length > 10) {
            descriptionFound = true;
            this.results.elements.description = {
              found: true,
              selector: selector            };
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (!descriptionFound) {
      this.results.warnings.push({
        type: 'warning',
        element: 'product_description',
        message: 'Product description not found or too short',
        selectors: this.selectors.productDescription
      });
      this.results.elements.description = { found: false };
    }
  }

  /**
   * Test add to cart button
   */
  async testAddToCartButton() {
    console.log(chalk.gray('  ✓ Checking add to cart button...'));
    
    let buttonFound = false;
    let buttonVisible = false;
    let buttonEnabled = false;

    for (const selector of this.selectors.addToCart) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          buttonFound = true;
          const isVisible = await this.page.evaluate(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }, element);
          
          const isEnabled = await this.page.evaluate(el => !el.disabled, element);
          
          if (isVisible) buttonVisible = true;
          if (isEnabled) buttonEnabled = true;

          this.results.elements.addToCart = {
            found: true,
            selector: selector,
            visible: isVisible,
            enabled: isEnabled
          };
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!buttonFound) {
      this.results.errors.push({
        type: 'critical',
        element: 'add_to_cart_button',
        message: 'Add to cart button not found on page',
        selectors: this.selectors.addToCart
      });
      this.results.elements.addToCart = { found: false };
    } else if (!buttonVisible) {
      this.results.errors.push({
        type: 'critical',
        element: 'add_to_cart_button',
        message: 'Add to cart button is not visible'
      });
    } else if (!buttonEnabled) {
      this.results.warnings.push({
        type: 'warning',
        element: 'add_to_cart_button',
        message: 'Add to cart button is disabled (product may be out of stock)'
      });
    }
  }

  /**
   * Test product images (basic check, detailed validation in image module)
   */
  async testProductImages() {
    console.log(chalk.gray('  ✓ Checking product images...'));
    
    let imageFound = false;

    for (const selector of this.selectors.productImage) {
      try {
        const images = await this.page.$$(selector);
        if (images.length > 0) {
          imageFound = true;
          this.results.elements.images = {
            found: true,
            count: images.length,
            selector: selector
          };
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!imageFound) {
      this.results.warnings.push({
        type: 'warning',
        element: 'product_images',
        message: 'No product images found with standard selectors',
        selectors: this.selectors.productImage
      });
      this.results.elements.images = { found: false };
    }
  }

  /**
   * Test product variants (size, color, etc.)
   */
  async testProductVariants() {
    console.log(chalk.gray('  ✓ Checking product variants...'));
    
    let variantFound = false;

    for (const selector of this.selectors.productVariant) {
      try {
        const variants = await this.page.$$(selector);
        if (variants.length > 0) {
          variantFound = true;
          this.results.elements.variants = {
            found: true,
            count: variants.length,
            selector: selector
          };
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Variants are optional, so we just log if found
    if (variantFound) {
      this.results.elements.variants = this.results.elements.variants || { found: false };
    }
  }

  /**
   * Test meta information (page title, description)
   */
  async testMetaInformation() {
    console.log(chalk.gray('  ✓ Checking meta information...'));
    
    try {
      const pageTitle = await this.page.title();
      const metaDescription = await this.page.$eval('meta[name="description"]', el => el.content).catch(() => null);

      this.results.elements.meta = {
        title: pageTitle || null,
        description: metaDescription || null
      };

      if (!pageTitle || pageTitle.length < 5) {
        this.results.warnings.push({
          type: 'warning',
          element: 'meta_title',
          message: 'Page title is missing or too short'
        });
      }

      if (!metaDescription) {
        this.results.warnings.push({
          type: 'warning',
          element: 'meta_description',
          message: 'Meta description is missing'
        });
      }
    } catch (error) {
      this.results.warnings.push({
        type: 'warning',
        element: 'meta_information',
        message: 'Error checking meta information: ' + error.message
      });
    }
  }
}

