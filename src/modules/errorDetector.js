/**
 * Error Detection Module
 * Captures JavaScript errors, network failures, and console warnings
 */

import chalk from 'chalk';

export class ErrorDetector {
  constructor(page, config) {
    this.page = page;
    this.config = config;
    this.results = {
      passed: true,
      consoleErrors: [],
      networkFailures: [],
      resourceFailures: [],
      corsErrors: [],
      performanceWarnings: [],
      securityErrors: [],
      totalErrors: 0,
      totalWarnings: 0
    };
  }

  /**
   * Set up error detection listeners
   */
  async setup() {
    console.log(chalk.blue('\n🔍 Setting up Error Detection...'));

    // Capture console errors
    this.page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        this.results.consoleErrors.push({
          type: 'console_error',
          message: msg.text(),
          location: this.getErrorLocation(msg),
          timestamp: new Date().toISOString()
        });
        this.results.totalErrors++;
      } else if (type === 'warning') {
        this.results.totalWarnings++;
      }
    });

    // Capture page errors (Puppeteer uses 'pageerror' event)
    this.page.on('pageerror', error => {
      this.results.consoleErrors.push({
        type: 'page_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      this.results.totalErrors++;
    });

    // Capture request failures
    this.page.on('requestfailed', request => {
      const url = request.url();
      const failure = request.failure();
      
      const errorInfo = {
        url: url,
        method: request.method(),
        failure: failure?.errorText || 'Unknown failure',
        timestamp: new Date().toISOString()
      };

      // Categorize failures
      if (failure?.errorText?.includes('CORS') || failure?.errorText?.includes('cors')) {
        this.results.corsErrors.push(errorInfo);
      } else {
        this.results.networkFailures.push(errorInfo);
      }
      
      this.results.totalErrors++;
    });

    // Capture response errors (4xx, 5xx)
    this.page.on('response', async (response) => {
      const status = response.status();
      const url = response.url();
      
      if (status >= 400) {
        const request = response.request();
        const errorInfo = {
          url: url,
          status: status,
          statusText: response.statusText(),
          method: request ? request.method() : 'GET',
          timestamp: new Date().toISOString()
        };

        if (status >= 500) {
          // Server errors
          this.results.networkFailures.push({
            ...errorInfo,
            severity: 'critical'
          });
          this.results.totalErrors++;
        } else if (status >= 400) {
          // Client errors
          if (this.isCriticalResource(url)) {
            this.results.resourceFailures.push({
              ...errorInfo,
              severity: 'critical',
              resourceType: this.getResourceType(url)
            });
            this.results.totalErrors++;
          } else {
            this.results.networkFailures.push({
              ...errorInfo,
              severity: 'warning'
            });
            this.results.totalWarnings++;
          }
        }
      }

      // Check for security issues
      this.checkSecurityIssues(response);
    });

    // Monitor performance
    await this.setupPerformanceMonitoring();
  }

  /**
   * Run error detection
   */
  async detect() {
    console.log(chalk.blue('\n🚨 Detecting Errors...'));

    // Wait for page to fully load
    // Since error detection is set up before navigation, we just wait a bit
    // for any delayed errors to appear
    await new Promise(resolve => setTimeout(resolve, 1000));


    // Additional wait to catch delayed errors
    await new Promise(resolve => setTimeout(resolve, 3000));


    // Check performance metrics
    await this.checkPerformanceMetrics();

    // Analyze collected errors
    this.analyzeErrors();

    // Determine overall result based on error tolerance
    this.results.passed = this.checkErrorTolerance();

    return this.results;
  }

  /**
   * Analyze and categorize errors
   */
  analyzeErrors() {
    // Filter out common non-critical errors
    this.results.consoleErrors = this.results.consoleErrors.filter(error => {
      const message = error.message.toLowerCase();
      // Filter out common analytics/advertising errors that don't affect functionality
      const ignorablePatterns = [
        'analytics',
        'google-analytics',
        'facebook',
        'advertising',
        'adblock',
        'tracking',
        'pixel'
      ];
      
      return !ignorablePatterns.some(pattern => message.includes(pattern));
    });

    // Categorize console errors by severity
    this.results.consoleErrors = this.results.consoleErrors.map(error => {
      const message = error.message.toLowerCase();
      let severity = 'warning';

      if (message.includes('uncaught') || 
          message.includes('syntax error') ||
          message.includes('reference error') ||
          message.includes('type error')) {
        severity = 'critical';
      }

      return { ...error, severity };
    });

    // Count critical vs warning errors
    const criticalErrors = this.results.consoleErrors.filter(e => e.severity === 'critical').length;
    const warningErrors = this.results.consoleErrors.filter(e => e.severity === 'warning').length;

    console.log(chalk.gray(`  Found ${criticalErrors} critical errors, ${warningErrors} warnings`));
    console.log(chalk.gray(`  Network failures: ${this.results.networkFailures.length}`));
    console.log(chalk.gray(`  Resource failures: ${this.results.resourceFailures.length}`));
    console.log(chalk.gray(`  CORS errors: ${this.results.corsErrors.length}`));
  }

  /**
   * Check if error count is within tolerance
   */
  checkErrorTolerance() {
    const criticalErrors = this.results.consoleErrors.filter(e => e.severity === 'critical').length;
    const criticalNetworkFailures = this.results.networkFailures.filter(f => f.severity === 'critical').length;
    const criticalResourceFailures = this.results.resourceFailures.filter(f => f.severity === 'critical').length;

    const totalCritical = criticalErrors + criticalNetworkFailures + criticalResourceFailures;

    if (totalCritical > this.config.errorTolerance.critical) {
      return false;
    }

    if (this.results.totalWarnings > this.config.errorTolerance.warning) {
      return false;
    }

    return true;
  }

  /**
   * Setup performance monitoring
   */
  async setupPerformanceMonitoring() {
    // Monitor for performance issues after page loads
    // Note: Puppeteer doesn't have a direct 'load' event, so we'll check after navigation
    // This will be called from the detect() method after page loads
  }

  /**
   * Check performance metrics
   */
  async checkPerformanceMetrics() {
    try {
      const performanceMetrics = await this.page.evaluate(() => {
        const perfData = window.performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
          loadComplete: perfData.loadEventEnd - perfData.navigationStart,
          firstPaint: navigation?.paintTiming?.firstPaint || null,
          firstContentfulPaint: navigation?.paintTiming?.firstContentfulPaint || null
        };
      });

      // Warn if page load is slow
      if (performanceMetrics.loadComplete > 5000) {
        this.results.performanceWarnings.push({
          type: 'slow_load',
          message: `Page load time: ${performanceMetrics.loadComplete}ms`,
          metrics: performanceMetrics
        });
      }
    } catch (error) {
      // Ignore performance monitoring errors
    }
  }

  /**
   * Check for security issues in response
   */
  checkSecurityIssues(response) {
    const url = response.url();
    const headers = response.headers();

    // Check for mixed content (HTTP resources on HTTPS page)
    if (url.startsWith('http://') && this.page.url().startsWith('https://')) {
      this.results.securityErrors.push({
        type: 'mixed_content',
        url: url,
        message: 'HTTP resource loaded on HTTPS page',
        timestamp: new Date().toISOString()
      });
    }

    // Check for insecure cookies
    if (headers['set-cookie']) {
      const cookies = Array.isArray(headers['set-cookie']) 
        ? headers['set-cookie'] 
        : [headers['set-cookie']];
      
      cookies.forEach(cookie => {
        if (!cookie.includes('Secure') && this.page.url().startsWith('https://')) {
          this.results.securityErrors.push({
            type: 'insecure_cookie',
            url: url,
            message: 'Cookie set without Secure flag on HTTPS page',
            timestamp: new Date().toISOString()
          });
        }
      });
    }
  }

  /**
   * Get error location from console message
   */
  getErrorLocation(msg) {
    try {
      // Puppeteer console messages don't have location() method
      // Extract from message text if available
      const text = msg.text();
      const match = text.match(/(.+?):(\d+):(\d+)/);
      if (match) {
        return {
          url: match[1],
          lineNumber: parseInt(match[2]),
          columnNumber: parseInt(match[3])
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if resource is critical
   */
  isCriticalResource(url) {
    const criticalPatterns = [
      '/checkout',
      '/cart',
      '/api',
      '.css',
      'main.js',
      'app.js',
      'bundle.js'
    ];
    
    return criticalPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.js')) return 'script';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) return 'image';
    if (url.includes('font')) return 'font';
    return 'other';
  }
}

