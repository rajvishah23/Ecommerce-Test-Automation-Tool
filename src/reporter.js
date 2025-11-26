/**
 * Test Report Generator
 * Generates comprehensive test reports in JSON and HTML formats
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Reporter {
  constructor(outputDir = './reports') {
    this.outputDir = outputDir;
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(testResults, outputPath = null) {
    const timestamp = new Date().toISOString();
    const reportId = `report-${Date.now()}`;
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    // Generate JSON report
    const jsonReport = this.generateJSONReport(testResults, timestamp);
    const jsonPath = path.join(this.outputDir, `${reportId}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(testResults, timestamp, jsonReport);
    const htmlPath = path.join(this.outputDir, `${reportId}.html`);
    await fs.writeFile(htmlPath, htmlReport);

    // Generate summary
    const summary = this.generateSummary(testResults, timestamp);
    const summaryPath = path.join(this.outputDir, 'latest-summary.txt');
    await fs.writeFile(summaryPath, summary);

    this.printCLISummary(testResults);
    
    return {
      json: jsonPath,
      html: htmlPath,
      summary: summaryPath,
      reportId: reportId
    };
  }

  /**
 * Print CLI report to terminal
 */
printCLISummary(testResults) {
    console.log('\n================ TEST EXECUTION SUMMARY ================\n');
  
    testResults.forEach((result, index) => {
      const overall = result.overall.passed ? '✅ PASSED' : '❌ FAILED';
      const productPageStatus = result.productPage.passed ? '✅ PASSED' : '❌ FAILED';
      const imagesStatus = result.images.passed ? '✅ PASSED' : '❌ FAILED';
      const errorStatus = result.errors.passed ? '✅ PASSED' : '❌ FAILED';
  
      console.log(`Test ${index + 1}: ${result.url}`);
      console.log(`Platform: ${result.platform}`);
      console.log(`Overall Status: ${overall}`);
      console.log('--------------------------------------------------');
      console.log(`📦 Product Page Elements : ${productPageStatus}`);
      console.log(`🖼 Images Check          : ${imagesStatus}`);
      console.log(`🚨 Error Detection      : ${errorStatus}`);
  
      if (!result.productPage.passed) {
        console.log('\n❗ Product Page Errors:');
        result.productPage.errors.forEach(e => {
          console.log(` - ${e.element}: ${e.message}`);
        });
      }
  
      console.log('\n==================================================\n');
    });
  }
  
  /**
   * Generate JSON report
   */
  generateJSONReport(testResults, timestamp) {
    return {
      metadata: {
        timestamp: timestamp,
        tool: 'Ecommerce Test Automation',
        version: '1.0.0'
      },
      summary: {
        overallStatus: this.getOverallStatus(testResults),
        totalTests: testResults.length,
        passed: testResults.filter(r => r.overall.passed).length,
        failed: testResults.filter(r => !r.overall.passed).length
      },
      results: testResults.map(result => ({
        url: result.url,
        platform: result.platform,
        timestamp: result.timestamp,
        overall: result.overall,
        productPage: result.productPage,
        images: result.images,
        errors: result.errors
      }))
    };
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(testResults, timestamp, jsonReport) {
    const overallStatus = this.getOverallStatus(testResults);
    const statusColor = overallStatus === 'PASSED' ? '#10b981' : '#ef4444';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ecommerce Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; margin-bottom: 10px; }
        .timestamp { color: #6b7280; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
        }
        .summary-card.passed { border-left-color: #10b981; }
        .summary-card.failed { border-left-color: #ef4444; }
        .summary-card h3 { color: #374151; font-size: 14px; text-transform: uppercase; margin-bottom: 10px; }
        .summary-card .value { font-size: 32px; font-weight: bold; color: #1f2937; }
        .test-result {
            margin-bottom: 40px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
        }
        .test-url { font-size: 18px; font-weight: 600; color: #1f2937; }
        .test-status {
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 14px;
        }
        .status-passed { background: #d1fae5; color: #065f46; }
        .status-failed { background: #fee2e2; color: #991b1b; }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .element-item {
            padding: 10px;
            background: white;
            margin-bottom: 8px;
            border-radius: 4px;
            border-left: 3px solid #3b82f6;
        }
        .element-item.found { border-left-color: #10b981; }
        .element-item.missing { border-left-color: #ef4444; }
        .error-item, .warning-item {
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 4px;
            font-size: 14px;
        }
        .error-item {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            color: #991b1b;
        }
        .warning-item {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            color: #92400e;
        }
        .metric {
            display: inline-block;
            padding: 6px 12px;
            background: #eff6ff;
            border-radius: 4px;
            margin-right: 10px;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .metric-label { color: #6b7280; font-size: 12px; }
        .metric-value { color: #1f2937; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛒 Ecommerce Test Automation Report</h1>
        <div class="timestamp">Generated: ${new Date(timestamp).toLocaleString()}</div>
        
        <div class="summary">
            <div class="summary-card ${overallStatus === 'PASSED' ? 'passed' : 'failed'}">
                <h3>Overall Status</h3>
                <div class="value" style="color: ${statusColor}">${overallStatus}</div>
            </div>
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="value">${jsonReport.summary.totalTests}</div>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <div class="value">${jsonReport.summary.passed}</div>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <div class="value">${jsonReport.summary.failed}</div>
            </div>
        </div>

        ${testResults.map(result => this.generateTestResultHTML(result)).join('')}
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML for a single test result
   */
  generateTestResultHTML(result) {
    const status = result.overall.passed ? 'PASSED' : 'FAILED';
    const statusClass = result.overall.passed ? 'status-passed' : 'status-failed';
    
    return `
        <div class="test-result">
            <div class="test-header">
                <div class="test-url">${this.escapeHtml(result.url)}</div>
                <div class="test-status ${statusClass}">${status}</div>
            </div>
            
            <div class="section">
                <div class="section-title">📦 Product Page Elements</div>
                ${this.generateElementsHTML(result.productPage.elements)}
                ${result.productPage.errors.length > 0 ? `
                    <div style="margin-top: 15px;">
                        ${result.productPage.errors.map(e => `
                            <div class="error-item">
                                <strong>${this.escapeHtml(e.element)}:</strong> ${this.escapeHtml(e.message)}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            ${result.productPage.variants && result.productPage.variants.length > 0 ? `
<div class="section">
    <div class="section-title">🧩 Product Variants</div>
    ${result.productPage.variants.map(variant => `
        <div class="element-item found">
            <strong>${this.escapeHtml(variant.name || 'Variant')}:</strong>
            ${variant.options ? this.escapeHtml(variant.options.join(', ')) : 'Options not available'}
            ${variant.available === false 
              ? '<span style="color:#ef4444;"> (Out of Stock)</span>' 
              : '<span style="color:#10b981;"> (Available)</span>'}
        </div>
    `).join('')}
</div>
` : ''}

            <div class="section">
                <div class="section-title">🖼️ Image Validation</div>
                <div>
                    <span class="metric">
                        <span class="metric-label">Total:</span>
                        <span class="metric-value">${result.images.totalImages}</span>
                    </span>
                    <span class="metric">
                        <span class="metric-label">Loaded:</span>
                        <span class="metric-value">${result.images.loadedImages}</span>
                    </span>
                    <span class="metric">
                        <span class="metric-label">Failed:</span>
                        <span class="metric-value">${result.images.failedImages.length}</span>
                    </span>
                </div>
                ${result.images.failedImages.length > 0 ? `
                    <div style="margin-top: 15px;">
                        ${result.images.failedImages.slice(0, 5).map(img => `
                            <div class="error-item">
                                <strong>Failed Image:</strong> ${this.escapeHtml(img.src.substring(0, 80))}...
                                ${img.error ? ` (${this.escapeHtml(img.error)})` : ''}
                            </div>
                        `).join('')}
                        ${result.images.failedImages.length > 5 ? `<div class="warning-item">... and ${result.images.failedImages.length - 5} more</div>` : ''}
                    </div>
                ` : ''}
            </div>

            <div class="section">
                <div class="section-title">🚨 Error Detection</div>
                <div>
                    <span class="metric">
                        <span class="metric-label">Console Errors:</span>
                        <span class="metric-value">${result.errors.consoleErrors.length}</span>
                    </span>
                    <span class="metric">
                        <span class="metric-label">Network Failures:</span>
                        <span class="metric-value">${result.errors.networkFailures.length}</span>
                    </span>
                    <span class="metric">
                        <span class="metric-label">CORS Errors:</span>
                        <span class="metric-value">${result.errors.corsErrors.length}</span>
                    </span>
                </div>
                ${result.errors.consoleErrors.length > 0 ? `
                    <div style="margin-top: 15px;">
                        <strong>Console Errors:</strong>
                        ${result.errors.consoleErrors.slice(0, 5).map(e => `
                            <div class="error-item">
                                ${this.escapeHtml(e.message)}
                            </div>
                        `).join('')}
                        ${result.errors.consoleErrors.length > 5 ? `<div class="warning-item">... and ${result.errors.consoleErrors.length - 5} more</div>` : ''}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
  }

  /**
   * Generate HTML for elements
   */
  generateElementsHTML(elements) {
    const elementNames = {
      title: 'Product Title',
      price: 'Product Price',
      description: 'Description',
      addToCart: 'Add to Cart Button',
      images: 'Product Images',
      variants: 'Product Variants',
      meta: 'Meta Information'
    };

    return Object.entries(elements).map(([key, value]) => {
      const found = value.found !== false;
      return `
        <div class="element-item ${found ? 'found' : 'missing'}">
            <strong>${elementNames[key] || key}:</strong> 
            ${found ? '✓ Found' : '✗ Missing'}
            ${value.text ? ` - "${this.escapeHtml(String(value.text).substring(0, 50))}"` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Generate text summary
   */
  generateSummary(testResults, timestamp) {
    const overallStatus = this.getOverallStatus(testResults);
    const passed = testResults.filter(r => r.overall.passed).length;
    const failed = testResults.filter(r => !r.overall.passed).length;

    let summary = `Ecommerce Test Automation Report\n`;
    summary += `Generated: ${new Date(timestamp).toLocaleString()}\n`;
    summary += `\n${'='.repeat(60)}\n\n`;
    summary += `Overall Status: ${overallStatus}\n`;
    summary += `Total Tests: ${testResults.length}\n`;
    summary += `Passed: ${passed}\n`;
    summary += `Failed: ${failed}\n`;
    summary += `\n${'='.repeat(60)}\n\n`;

    testResults.forEach((result, index) => {
      summary += `Test ${index + 1}: ${result.url}\n`;
      summary += `Status: ${result.overall.passed ? 'PASSED' : 'FAILED'}\n`;
      summary += `Platform: ${result.platform}\n`;
      summary += `\nProduct Page: ${result.productPage.passed ? 'PASSED' : 'FAILED'}\n`;
      summary += `  Errors: ${result.productPage.errors.length}\n`;
      summary += `  Warnings: ${result.productPage.warnings.length}\n`;
      summary += `\nImages: ${result.images.passed ? 'PASSED' : 'FAILED'}\n`;
      summary += `  Total: ${result.images.totalImages}\n`;
      summary += `  Loaded: ${result.images.loadedImages}\n`;
      summary += `  Failed: ${result.images.failedImages.length}\n`;
      summary += `\nErrors: ${result.errors.passed ? 'PASSED' : 'FAILED'}\n`;
      summary += `  Console Errors: ${result.errors.consoleErrors.length}\n`;
      summary += `  Network Failures: ${result.errors.networkFailures.length}\n`;
      summary += `  CORS Errors: ${result.errors.corsErrors.length}\n`;
      summary += `\n${'-'.repeat(60)}\n\n`;
    });

    return summary;
  }

  /**
   * Get overall status
   */
  getOverallStatus(testResults) {
    const allPassed = testResults.every(r => r.overall.passed);
    return allPassed ? 'PASSED' : 'FAILED';
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }
}

