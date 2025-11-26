# 🛒 Ecommerce Test Automation Tool

A comprehensive browser test automation tool designed to validate critical functionality on Shopify and BigCommerce ecommerce websites. This tool performs automated testing of product pages, image loading validation, and error detection for production readiness.

![Tool Screenshot 1](https://github.com/rajvishah23/Ecommerce-Test-Automation-Tool/blob/main/Screenshot%202025-11-26%20at%2010.00.01%20AM.png) 

## Features

### ✅ Product Page Testing

* Validates critical product elements (title, price, add-to-cart button)
* Checks product description and variants
* Verifies meta information (page title, description)
* Validates page responsiveness and layout integrity

### 🖼️ Image Loading Validation

* Checks all product images load successfully
* Validates image dimensions and alt-text for accessibility
* Detects broken images (404 errors)
* Supports lazy-loaded images

### 🚨 Error Detection

* Captures JavaScript console errors and uncaught exceptions
* Monitors network request failures (4xx, 5xx HTTP responses)
* Detects resource loading failures (CSS, JS, images)
* Identifies CORS errors and security issues
* Performance monitoring and warnings

## Technology Stack

* **Puppeteer**: Browser automation framework
* **Node.js**: Runtime environment
* **Chrome Headless**: Browser engine

## Prerequisites

* Node.js 18+ installed
* npm or yarn package manager
* Internet connection for testing live websites

## Installation

1. Clone or download this repository

2. Install dependencies:

```bash
npm install
```

3. Install Chromium browser (automatically handled by Puppeteer):

```bash
npm run install-browsers
```

## Usage

### Basic Usage

Test a single product page:

```bash
node src/runner.js --url https://example-store.myshopify.com/products/product-name
```

Test multiple product pages:

```bash
node src/runner.js --products \
  https://example-store.myshopify.com/products/product-1 \
  https://example-store.myshopify.com/products/product-2 \
  https://example-store.myshopify.com/products/product-3
```

### Command Line Options

```
Options:
  -u, --url <url>              Base URL of the ecommerce website
  -p, --products <urls...>      Product page URLs to test (space-separated)
  -c, --config <path>           Path to custom configuration file (JSON)
  -o, --output <dir>            Output directory for reports (default: ./reports)
  --platform <platform>         Platform type: shopify or bigcommerce (default: shopify)
  --headless                    Run in headless mode (default: true)
  --no-headless                 Run with browser visible
  -h, --help                    Display help for command
```

### Examples

**Test with custom output directory:**

```bash
node src/runner.js --products https://example.com/product --output ./test-results
```

**Test with visible browser (for debugging):**

```bash
node src/runner.js --products https://example.com/product --no-headless
```

**Test with custom configuration:**

```bash
node src/runner.js --products https://example.com/product --config ./custom-config.json
```

**Auto-detect platform:**

```bash
node src/runner.js --products https://example.com/product --platform auto
```

## Configuration

### Default Configuration

The tool comes with sensible defaults configured in `src/config.js`. You can override these by creating a custom JSON configuration file:

```json
{
  "browser": {
    "headless": true,
    "defaultViewport": {
      "width": 1920,
      "height": 1080
    }
  },
  "timeouts": {
    "pageLoad": 30000,
    "elementWait": 10000,
    "navigation": 30000
  },
  "retry": {
    "attempts": 3,
    "delay": 2000
  },
  "errorTolerance": {
    "critical": 0,
    "warning": 5,
    "network": 2
  }
}
```

## Reports

The tool generates comprehensive reports in multiple formats:

### Report Formats

1. **JSON Report** (`report-{timestamp}.json`)

   * Machine-readable format
   * Complete test results with all details
   * Suitable for CI/CD integration

2. **HTML Report** (`report-{timestamp}.html`)

   * Human-readable visual report
   * Color-coded results
   * Detailed error information
   * Open in any web browser

3. **Text Summary** (`latest-summary.txt`)

   * Quick overview
   * Terminal-friendly format

### Report Location

Reports are saved in the `./reports` directory by default (or custom directory specified with `--output`).

### Sample Report Structure

```
reports/
├── report-1703123456789.json
├── report-1703123456789.html
└── latest-summary.txt
```

## ✅ Deployment Method (Bolt Platform)

This project is optimized for **Bolt-based deployment**, enabling fast, scalable, and automated execution of ecommerce test workflows.

### Bolt Deployment Steps

1. Prepare your project
   Ensure the following files exist:

* `package.json`
* `src/runner.js`
* `.env` (optional for environment variables)

2. Create Bolt Configuration File
   Create `bolt.config.json` in the root directory:

```json
{
  "name": "ecommerce-test-automation",
  "runtime": "nodejs18",
  "start": "node src/runner.js",
  "build": "npm install",
  "env": {
    "PLATFORM": "shopify",
    "OUTPUT_DIR": "./reports"
  }
}
```

3. Deploy to Bolt
   From your project root directory, run:

```bash
bolt deploy
```

4. Schedule Automated Runs (Optional)
   If Bolt supports cron jobs, configure scheduled test execution:

```json
{
  "schedule": "0 */6 * * *"
}
```

This will run your ecommerce tests every 6 hours automatically.

### Running with Custom Inputs on Bolt

```bash
bolt run --products "https://store.com/product1 https://store.com/product2"
```

### Bolt Environment Variables

You can define environment variables in Bolt dashboard or via CLI:

```bash
bolt env set TEST_URLS="https://store.com/p1 https://store.com/p2"
bolt env set PLATFORM="shopify"
```

## Project Structure

```
.
├── src/
│   ├── runner.js              # Main test runner
│   ├── config.js              # Configuration module
│   ├── reporter.js            # Report generator
│   └── modules/
│       ├── productPageTester.js   # Product page validation
│       ├── imageValidator.js      # Image loading validation
│       └── errorDetector.js       # Error detection
├── reports/                   # Generated test reports
├── package.json
├── README.md
└── .gitignore
```

## Troubleshooting

* Browser not launching: Run `npm run install-browsers`
* Timeout Errors: Increase timeout in config
* Missing selectors: Use `--no-headless` and update config
* False positives: Adjust `errorTolerance` values
