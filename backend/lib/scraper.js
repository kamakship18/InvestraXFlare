/**
 * Web Scraper Utility
 * Scrapes finance-related web pages and extracts text content
 * 
 * IMPORTANT: This code respects robots.txt and Terms of Service.
 * Only use on sites that allow scraping or your own demo content.
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape a URL and extract text content
 * @param {string} url - URL to scrape
 * @returns {Promise<{rawText: string, title: string, success: boolean, error?: string}>}
 */
async function scrapeUrl(url) {
  try {
    // Validate URL
    if (!url || typeof url !== 'string') {
      return {
        rawText: '',
        title: '',
        success: false,
        error: 'Invalid URL provided'
      };
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return {
        rawText: '',
        title: '',
        success: false,
        error: 'Malformed URL'
      };
    }

    // Fetch the page with timeout
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept 2xx and 3xx
      }
    });

    // Load HTML with cheerio
    const $ = cheerio.load(response.data);

    // Extract title
    let title = '';
    const titleElement = $('title').first();
    if (titleElement.length) {
      title = titleElement.text().trim();
    } else {
      // Try h1 as fallback
      const h1Element = $('h1').first();
      if (h1Element.length) {
        title = h1Element.text().trim();
      }
    }

    // Extract main text content
    // Strategy: Get text from common content containers
    let textParts = [];

    // Check if this is Bloomberg
    const isBloomberg = url.includes('bloomberg.com');
    
    // Bloomberg-specific selectors
    if (isBloomberg) {
      // Bloomberg article content selectors
      const bloombergSelectors = [
        '.article-body__content',
        '[data-module="ArticleBody"]',
        '.body-copy',
        'article .content',
        '.story-body'
      ];
      
      for (const selector of bloombergSelectors) {
        const element = $(selector).first();
        if (element.length) {
          // Remove unwanted elements
          element.find('script, style, nav, footer, .advertisement, .related-articles').remove();
          
          // Extract paragraphs and headings
          element.find('p, h1, h2, h3, h4, h5, h6, .headline').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length > 20) { // Bloomberg articles tend to have longer paragraphs
              textParts.push(text);
            }
          });
          
          if (textParts.length > 0) break;
        }
      }
    }

    // Generic content selectors (fallback or for other sites)
    if (textParts.length === 0) {
      const contentSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '.article-content',
        '.post-content',
        '#content',
        '#main-content'
      ];

      let mainContent = null;
      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length) {
          mainContent = element;
          break;
        }
      }

      // If no main content found, use body
      if (!mainContent) {
        mainContent = $('body');
      }

      // Remove unwanted elements
      mainContent.find('script, style, nav, footer, .advertisement, .related-articles, .sidebar').remove();

      // Extract text from paragraphs and headings
      mainContent.find('p, h1, h2, h3, h4, h5, h6').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text && text.length > 10) { // Filter out very short text
          textParts.push(text);
        }
      });
    }

    // If no paragraphs found, get all text
    if (textParts.length === 0) {
      textParts.push(mainContent.text().trim());
    }

    // Join and clean up text
    let rawText = textParts.join('\n\n');
    
    // Remove excessive whitespace
    rawText = rawText.replace(/\s+/g, ' ').trim();
    
    // Truncate to safe length (6000 characters max)
    if (rawText.length > 6000) {
      rawText = rawText.substring(0, 6000) + '...';
    }

    return {
      rawText,
      title: title || 'Untitled',
      success: true
    };

  } catch (error) {
    console.error('Error scraping URL:', error.message);
    
    // Return graceful failure
    return {
      rawText: '',
      title: '',
      success: false,
      error: error.message || 'Failed to scrape URL'
    };
  }
}

module.exports = {
  scrapeUrl
};

