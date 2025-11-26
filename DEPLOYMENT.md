# Cloud Deployment Guide

This guide covers deploying the Ecommerce Test Automation tool to various cloud platforms.

## Prerequisites

- Node.js 18+ installed
- Git repository (if using CI/CD)
- Cloud platform account (AWS, GCP, Azure, Vercel, etc.)

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
