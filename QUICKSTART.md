# Quick Start Guide

## Installation

```bash
# Install dependencies
npm install

# The Chromium browser will be downloaded automatically by Puppeteer
```

## Basic Usage

### Test a Single Product Page

```bash
node src/runner.js --products https://example-store.myshopify.com/products/product-name
```

### Test Multiple Product Pages

```bash
node src/runner.js --products \
  https://store1.com/products/product1 \
  https://store1.com/products/product2 \
  https://store2.com/products/product3
```

### Test with Custom Output Directory

```bash
node src/runner.js --products https://example.com/product --output ./my-reports
```

### Test with Visible Browser (for debugging)

```bash
node src/runner.js --products https://example.com/product --no-headless
```

### Test with Custom Configuration

```bash
node src/runner.js --products https://example.com/product --config ./example-config.json
```

## Viewing Results

After running tests, reports are generated in the `./reports` directory (or your custom output directory):

- **HTML Report**: Open `report-{timestamp}.html` in your browser for a visual report
- **JSON Report**: `report-{timestamp}.json` for programmatic access
- **Text Summary**: `latest-summary.txt` for quick terminal review

## Example Output

```
🛒 Ecommerce Test Automation Tool

Configuration:
  Platform: shopify
  Headless: true
  Product URLs: 1
  Output Directory: ./reports

🚀 Launching browser...
  Browser launched successfully


============================================================
Testing: https://www.halfpricedrapes.com/products/birch-textured-faux-linen-room-darkening-curtain
============================================================
🌐 Navigating to page...
  Warning: Navigation issue: Navigation timeout of 30000 ms exceeded

🔍 Setting up Error Detection...

📦 Testing Product Page Elements...
  ✓ Checking product title...
  ✓ Checking product price...
  ✓ Checking product description...
  ✓ Checking add to cart button...
  ✓ Checking product images...
  ✓ Checking product variants...
  ✓ Checking meta information...

🖼️  Validating Image Loading...
  Found 82 images on page
  ✓ Checking lazy-loaded images...

🚨 Detecting Errors...
  Found 0 critical errors, 2 warnings
  Network failures: 32
  Resource failures: 0
  CORS errors: 0

❌ Test FAILED

📊 Generating reports...

================ TEST EXECUTION SUMMARY ================

Test 1: https://www.halfpricedrapes.com/products/birch-textured-faux-linen-room-darkening-curtain
Platform: shopify
Overall Status: ❌ FAILED
--------------------------------------------------
📦 Product Page Elements : ✅ PASSED
🖼 Images Check          : ❌ FAILED
🚨 Error Detection      : ✅ PASSED

==================================================


✅ Test execution completed!

Reports generated:
  JSON: reports/report-1764129692639.json
  HTML: reports/report-1764129692639.html
  Summary: reports/latest-summary.txt

## Common Issues

### Browser doesn't launch
```bash
# On Linux, you may need additional dependencies
sudo apt-get install -y chromium-browser
```

### Timeout errors
Increase timeout in config or use `--config` with a custom config file:
```json
{
  "timeouts": {
    "pageLoad": 60000
  }
}
```

### Selectors not found
Use `--no-headless` to see what's on the page, then add custom selectors to your config file.

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [APPROACH.md](APPROACH.md) for design decisions and trade-offs
- Review the sample report in `reports/sample-report.json`

