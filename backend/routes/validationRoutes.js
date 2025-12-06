/**
 * Validation Routes
 * Handles prediction validation with web scraping + AI sentiment analysis
 */

const express = require('express');
const router = express.Router();
const { scrapeUrl } = require('../lib/scraper');
const { computeValidationScore } = require('../lib/aiValidation');

/**
 * POST /api/validate-prediction
 * Validates a prediction using web scraping and AI analysis
 * 
 * Body:
 * {
 *   predictionText: string,
 *   assetSymbol: string,
 *   supportingUrl?: string
 * }
 */
router.post('/validate-prediction', async (req, res) => {
  try {
    const { predictionText, assetSymbol, supportingUrl } = req.body;

    if (!predictionText || !assetSymbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: predictionText and assetSymbol are required'
      });
    }

    let articleText = '';
    let articleTitle = '';
    let scrapingSuccess = false;

    // Scrape URL if provided
    if (supportingUrl) {
      console.log(`Scraping URL: ${supportingUrl}`);
      const scrapeResult = await scrapeUrl(supportingUrl);
      
      if (scrapeResult.success) {
        articleText = scrapeResult.rawText;
        articleTitle = scrapeResult.title;
        scrapingSuccess = true;
        console.log(`Successfully scraped ${articleText.length} characters from ${supportingUrl}`);
      } else {
        console.warn(`Failed to scrape URL: ${scrapeResult.error}`);
        // Continue with validation even if scraping fails
      }
    }

    // Compute AI validation score
    console.log('Computing AI validation score...');
    const validationResult = await computeValidationScore({
      predictionText,
      assetSymbol,
      articleText,
      articleTitle
    });

    // Return comprehensive result
    res.status(200).json({
      success: true,
      validationScore: validationResult.validationScore,
      sentimentLabel: validationResult.sentimentLabel,
      sentimentScore: validationResult.sentimentScore,
      articleSummary: validationResult.explanation,
      articleCredibility: validationResult.articleCredibility,
      supportingUrlUsed: scrapingSuccess,
      articleTitle: scrapingSuccess ? articleTitle : null,
      articleLength: scrapingSuccess ? articleText.length : 0
    });

  } catch (error) {
    console.error('Error in validate-prediction route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

