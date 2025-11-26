/**
 * Main Test Runner
 * Orchestrates the execution of all test modules
 */

import puppeteer from 'puppeteer';
import { ProductPageTester } from './modules/productPageTester.js';
import { ImageValidator } from './modules/imageValidator.js';
import { ErrorDetector } from './modules/errorDetector.js';
import { Reporter } from './reporter.js';
import { defaultConfig, mergeConfig } from './config.js';
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';

const program = new Command();

program
  .name('ecommerce-test-automation')
  .description('Browser test automation tool for Shopify/BigCommerce websites')
  .version('1.0.0')
  .option('-u, --url <url>', 'Base URL of the ecommerce website')
  .option('-p, --products <urls...>', 'Product page URLs to test (space-separated)')
  .option('-c, --config <path>', 'Path to custom configuration file (JSON)')
  .option('-o, --output <dir>', 'Output directory for reports', './reports')
  .option('--platform <platform>', 'Platform type: shopify or bigcommerce', 'shopify')
  .option('--headless', 'Run in headless mode', true)
  .option('--no-headless', 'Run with browser visible')
  .parse(process.argv);

const options = program.opts();

/**
 * Detect platform from URL or page content
 */
async function detectPlatform(page) {
  try {
    // Check for platform-specific indicators
    const platformIndicators = await page.evaluate(() => {
      const indicators = {
        shopify: false,
        bigcommerce: false
      };

      // Check for Shopify indicators
      if (window.Shopify || 
          document.querySelector('[data-shopify]') ||
          document.querySelector('script[src*="shopify"]') ||
          document.body.innerHTML.includes('shopify')) {
        indicators.shopify = true;
      }

      // Check for BigCommerce indicators
      if (window.bigcommerce || 
          document.querySelector('[data-bigcommerce]') ||
          document.querySelector('script[src*="bigcommerce"]') ||
          document.body.innerHTML.includes('bigcommerce')) {
        indicators.bigcommerce = true;
      }

      return indicators;
    });

    if (platformIndicators.shopify) return 'shopify';
    if (platformIndicators.bigcommerce) return 'bigcommerce';
    
    // Default to shopify if URL contains shopify
    const url = page.url();
    if (url.includes('shopify') || url.includes('myshopify.com')) return 'shopify';
    if (url.includes('bigcommerce')) return 'bigcommerce';

    return 'shopify'; // Default
  } catch (error) {
    return 'shopify'; // Default fallback
  }
}

/**
 * Run tests on a single product page
 */
async function testProductPage(browser, url, config, platform) {
  console.log(chalk.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.cyan(`Testing: ${url}`));
  console.log(chalk.cyan(`${'='.repeat(60)}`));

  const page = await browser.newPage();
  const result = {
    url: url,
    platform: platform,
    timestamp: new Date().toISOString(),
    overall: { passed: true },
    productPage: {},
    images: {},
    errors: {}
  };

  try {
    // Navigate to page
    console.log(chalk.blue('🌐 Navigating to page...'));
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: config.timeouts.pageLoad
    }).catch(async error => {
      console.log(chalk.yellow(`  Warning: Navigation issue: ${error.message}`));
      // Try with domcontentloaded as fallback
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: config.timeouts.pageLoad
        });
      } catch (fallbackError) {
        console.log(chalk.yellow(`  Warning: Fallback navigation also failed`));
      }
    });

    // Detect platform if not specified
    if (!platform || platform === 'auto') {
      platform = await detectPlatform(page);
      result.platform = platform;
      console.log(chalk.gray(`  Detected platform: ${platform}`));
    }

    // Set up error detection first (before other tests)
    const errorDetector = new ErrorDetector(page, config);
    await errorDetector.setup();

    // Run product page tests
    const productTester = new ProductPageTester(page, config, platform);
    result.productPage = await productTester.test();

    // Run image validation
    const imageValidator = new ImageValidator(page, config);
    result.images = await imageValidator.validate();

    // Run error detection
    result.errors = await errorDetector.detect();

    // Determine overall result
    result.overall.passed = 
      result.productPage.passed &&
      result.images.passed &&
      result.errors.passed;

    if (result.overall.passed) {
      console.log(chalk.green('\n✅ Test PASSED'));
    } else {
      console.log(chalk.red('\n❌ Test FAILED'));
    }

  } catch (error) {
    console.error(chalk.red(`\n❌ Error testing ${url}:`), error.message);
    result.overall.passed = false;
    result.overall.error = error.message;
    result.overall.stack = error.stack;
  } finally {
    await page.close();
  }

  return result;
}

/**
 * Main execution function
 */
async function main() {
  console.log(chalk.bold.blue('\n🛒 Ecommerce Test Automation Tool\n'));

  // Validate inputs
  if (!options.url && !options.products) {
    console.error(chalk.red('Error: Either --url or --products must be provided'));
    console.log('\nUsage:');
    console.log('  node src/runner.js --url <base-url> --products <product-url-1> <product-url-2>');
    console.log('  node src/runner.js --products <product-url-1> <product-url-2>');
    process.exit(1);
  }

  // Load configuration
  let config = defaultConfig;
  if (options.config) {
    try {
      const configFile = await fs.readFile(options.config, 'utf-8');
      const userConfig = JSON.parse(configFile);
      config = mergeConfig(userConfig);
    } catch (error) {
      console.error(chalk.red(`Error loading config file: ${error.message}`));
      process.exit(1);
    }
  }

  // Override headless mode
  config.browser.headless = options.headless !== false;

  // Determine product URLs
  let productUrls = [];
  if (options.products && options.products.length > 0) {
    productUrls = options.products;
  } else if (options.url) {
    // If only base URL provided, try to find product pages
    // For now, just use the base URL as a single test
    productUrls = [options.url];
  }

  if (productUrls.length === 0) {
    console.error(chalk.red('Error: No product URLs to test'));
    process.exit(1);
  }

  console.log(chalk.gray(`Configuration:`));
  console.log(chalk.gray(`  Platform: ${options.platform || 'auto-detect'}`));
  console.log(chalk.gray(`  Headless: ${config.browser.headless}`));
  console.log(chalk.gray(`  Product URLs: ${productUrls.length}`));
  console.log(chalk.gray(`  Output Directory: ${options.output}\n`));

  // Launch browser
  console.log(chalk.blue('🚀 Launching browser...'));
  const browser = await puppeteer.launch(config.browser);
  console.log(chalk.green('  Browser launched successfully\n'));

  const testResults = [];

  try {
    // Run tests on each product URL
    for (const url of productUrls) {
      const result = await testProductPage(
        browser,
        url,
        config,
        options.platform || 'auto'
      );
      testResults.push(result);
    }

    // Generate reports
    console.log(chalk.blue('\n📊 Generating reports...'));
    const reporter = new Reporter(options.output);
    const reportPaths = await reporter.generateReport(testResults);

    console.log(chalk.green('\n✅ Test execution completed!'));
    console.log(chalk.gray(`\nReports generated:`));
    console.log(chalk.gray(`  JSON: ${reportPaths.json}`));
    console.log(chalk.gray(`  HTML: ${reportPaths.html}`));
    console.log(chalk.gray(`  Summary: ${reportPaths.summary}\n`));


  } catch (error) {
    console.error(chalk.red('\n❌ Fatal error:'), error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('Unhandled error:'), error);
    process.exit(1);
  });
}

export { main, testProductPage };

