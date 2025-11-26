/**
 * Image Loading Validation Module
 * Validates all images on the page load successfully
 */

import chalk from 'chalk';

export class ImageValidator {
  constructor(page, config) {
    this.page = page;
    this.config = config;
    this.results = {
      passed: true,
      totalImages: 0,
      loadedImages: 0,
      failedImages: [],
      missingAltText: [],
      images: []
    };
  }

  /**
   * Run all image validation tests
   */
  async validate() {
    console.log(chalk.blue('\n🖼️  Validating Image Loading...'));

    // Set up response interception to track image loading
    const imageResponses = new Map();
    
    this.page.on('response', response => {
      const url = response.url();
      if (this.isImageUrl(url)) {
        imageResponses.set(url, {
          status: response.status(),
          headers: response.headers(),
          url: url
        });
      }
    });

    // Wait for page to load - images are already loaded by the time this runs
    // since it's called after navigation in the runner
    await new Promise(resolve => setTimeout(resolve, 2000));


    // Get all images from the page
    const images = await this.getAllImages();

    this.results.totalImages = images.length;
    console.log(chalk.gray(`  Found ${images.length} images on page`));

    // Validate each image
    for (const img of images) {
      await this.validateImage(img, imageResponses);
    }

    // Check lazy-loaded images
    await this.checkLazyLoadedImages();

    // Determine overall result
    this.results.passed = this.results.failedImages.length === 0;
    this.results.loadedImages = this.results.totalImages - this.results.failedImages.length;

    return this.results;
  }

  /**
   * Get all images from the page
   */
  async getAllImages() {
    return await this.page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src,
        currentSrc: img.currentSrc,
        alt: img.alt || '',
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        complete: img.complete,
        loading: img.loading || 'eager'
      }));
    });
  }

  /**
   * Validate a single image
   */
  async validateImage(img, imageResponses) {
    const imageInfo = {
      src: img.src || img.currentSrc,
      alt: img.alt || '',
      width: img.width,
      height: img.height,
      loaded: false,
      status: null,
      error: null
    };

    // Check if image loaded successfully
    if (img.complete && img.width > 0 && img.height > 0) {
      imageInfo.loaded = true;
      this.results.loadedImages++;
    } else {
      // Check response status
      const response = imageResponses.get(img.src) || imageResponses.get(img.currentSrc);
      if (response) {
        imageInfo.status = response.status;
        if (response.status === 200) {
          imageInfo.loaded = true;
          this.results.loadedImages++;
        } else {
          imageInfo.loaded = false;
          imageInfo.error = `HTTP ${response.status}`;
          this.results.failedImages.push(imageInfo);
        }
      } else {
        // Try to fetch the image to check if it loads
      try {
        const response = await this.page.evaluate(async (url) => {
          try {
            const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            return { status: res.status || 200, ok: res.ok !== false };
          } catch (e) {
            // For CORS issues, try to check if image element loaded
            return { status: 0, ok: false, error: e.message };
          }
        }, img.src || img.currentSrc);

          if (response.ok && response.status === 200) {
            imageInfo.loaded = true;
            imageInfo.status = 200;
            this.results.loadedImages++;
          } else {
            imageInfo.loaded = false;
            imageInfo.status = response.status || 0;
            imageInfo.error = response.error || `HTTP ${response.status}`;
            this.results.failedImages.push(imageInfo);
          }
        } catch (error) {
          imageInfo.loaded = false;
          imageInfo.error = error.message;
          this.results.failedImages.push(imageInfo);
        }
      }
    }

    // Check for alt text (accessibility)
    if (!img.alt || img.alt.trim().length === 0) {
      // Skip decorative images (very small or data URIs)
      if (img.width > 50 && img.height > 50 && !img.src.startsWith('data:')) {
        this.results.missingAltText.push({
          src: img.src || img.currentSrc,
          width: img.width,
          height: img.height
        });
      }
    }

    // Validate dimensions
    if (img.width === 0 || img.height === 0) {
      imageInfo.error = 'Image has zero dimensions';
      if (!this.results.failedImages.find(f => f.src === imageInfo.src)) {
        this.results.failedImages.push(imageInfo);
      }
    }

    this.results.images.push(imageInfo);
  }

  /**
   * Check lazy-loaded images by scrolling
   */
  async checkLazyLoadedImages() {
    console.log(chalk.gray('  ✓ Checking lazy-loaded images...'));
    
    try {
      // Scroll to trigger lazy loading
      const scrollHeight = await this.page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = this.config.browser.defaultViewport.height;
      
      for (let scroll = 0; scroll < scrollHeight; scroll += viewportHeight) {
        await this.page.evaluate((y) => window.scrollTo(0, y), scroll);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for lazy loading
        
        // Check newly loaded images
        const newImages = await this.getAllImages();
        const newCount = newImages.length;
        
        if (newCount > this.results.totalImages) {
          // Validate new images
          for (const img of newImages.slice(this.results.totalImages)) {
            await this.validateImage(img, new Map());
          }
        }
      }

      // Scroll back to top
      await this.page.evaluate(() => window.scrollTo(0, 0));
    } catch (error) {
      this.results.warnings = this.results.warnings || [];
      this.results.warnings.push({
        type: 'warning',
        message: 'Error checking lazy-loaded images: ' + error.message
      });
    }
  }

  /**
   * Check if URL is an image
   */
  isImageUrl(url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext)) || 
           urlLower.includes('image') ||
           /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i.test(url);
  }
}

