/**
 * AI Validation Service
 * Uses Perplexity API to analyze prediction credibility
 * and sentiment from scraped article content
 */

const axios = require('axios');

/**
 * Compute validation score from prediction text and article content
 * @param {Object} params
 * @param {string} params.predictionText - The prediction text
 * @param {string} params.assetSymbol - Asset symbol (e.g., "BTC", "ETH")
 * @param {string} params.articleText - Scraped article text (optional)
 * @param {string} params.articleTitle - Article title (optional)
 * @returns {Promise<{validationScore: number, sentimentLabel: string, explanation: string, articleCredibility: number, sentimentScore: number}>}
 */
async function computeValidationScore({ predictionText, assetSymbol, articleText, articleTitle }) {
  try {
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!perplexityApiKey) {
      console.warn('PERPLEXITY_API_KEY not set, using fallback scoring');
      return getFallbackScore(predictionText, articleText);
    }

    // Build prompt for AI analysis
    let prompt = `You are a financial prediction validator. Analyze the following prediction and supporting article (if provided).

Prediction: "${predictionText}"
Asset: ${assetSymbol || 'Unknown'}`;

    if (articleText) {
      prompt += `\n\nSupporting Article:
Title: ${articleTitle || 'Untitled'}
Content: ${articleText.substring(0, 4000)}`;
    }

    prompt += `\n\nAnalyze and provide a JSON response with the following structure:
{
  "sentimentScore": number from -100 to +100 (negative = bearish, positive = bullish, 0 = neutral),
  "sentimentLabel": "bullish" | "bearish" | "neutral",
  "articleCredibility": number from 0-100 (how credible/trustworthy is the source),
  "supportScore": number from 0-100 (how strongly does the article support/refute the prediction),
  "explanation": "brief explanation of your assessment"
}

Consider:
1. Does the article support or contradict the prediction?
2. Is the source credible (financial news site, official reports, etc.)?
3. What is the overall sentiment about the asset?
4. How strong is the evidence provided?

Respond ONLY with valid JSON, no other text.`;

    // Call Perplexity API
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-large-128k-online', // Perplexity's online model with web search
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial analyst. Analyze predictions and supporting articles. Always respond with valid JSON only, no markdown, no code blocks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // Perplexity can take longer
      }
    );

    // Parse response
    let content = response.data.choices[0].message.content;
    
    // Clean up response (remove markdown code blocks if present)
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis;
    
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', content);
      return getFallbackScore(predictionText, articleText);
    }

    // Extract values with defaults
    const sentimentScore = typeof analysis.sentimentScore === 'number' ? analysis.sentimentScore : 0;
    const sentimentLabel = analysis.sentimentLabel || 'neutral';
    const articleCredibility = typeof analysis.articleCredibility === 'number' ? analysis.articleCredibility : 50;
    const supportScore = typeof analysis.supportScore === 'number' ? analysis.supportScore : 50;
    const explanation = analysis.explanation || 'Analysis completed';

    // Calculate combined validation score (0-100)
    // Formula: 40% article credibility + 40% support score + 20% sentiment alignment
    let validationScore = 0;
    
    if (articleText) {
      // If article provided, use full formula
      validationScore = Math.round(
        (articleCredibility * 0.4) +
        (supportScore * 0.4) +
        (Math.abs(sentimentScore) / 100 * 100 * 0.2)
      );
    } else {
      // If no article, base score on prediction text quality
      const textLength = predictionText.length;
      const hasNumbers = /\d/.test(predictionText);
      const hasReasoning = /because|due to|reason|analysis|data|evidence/i.test(predictionText);
      
      validationScore = Math.min(100, Math.round(
        (Math.min(textLength / 100, 1) * 30) +
        (hasNumbers ? 20 : 0) +
        (hasReasoning ? 30 : 0) +
        20 // Base score
      ));
    }

    // Ensure score is between 0-100
    validationScore = Math.max(0, Math.min(100, validationScore));

    return {
      validationScore,
      sentimentLabel,
      explanation,
      articleCredibility,
      sentimentScore,
      supportingUrlUsed: !!articleText
    };

  } catch (error) {
    console.error('Error in AI validation:', error.message);
    return getFallbackScore(predictionText, articleText);
  }
}

/**
 * Fallback scoring when AI API is unavailable
 */
function getFallbackScore(predictionText, articleText) {
  let score = 50; // Base score
  
  if (articleText) {
    // If article exists, give some credit
    score = 60;
    
    // Check for credible indicators
    if (/financial|market|analysis|report|news/i.test(articleText)) {
      score += 10;
    }
    
    if (articleText.length > 500) {
      score += 10;
    }
  }
  
  // Check prediction quality
  if (predictionText.length > 50) {
    score += 10;
  }
  
  if (/\d/.test(predictionText)) {
    score += 10;
  }
  
  return {
    validationScore: Math.min(100, score),
    sentimentLabel: 'neutral',
    explanation: 'External data unavailable - using basic scoring',
    articleCredibility: articleText ? 60 : 0,
    sentimentScore: 0,
    supportingUrlUsed: !!articleText
  };
}

module.exports = {
  computeValidationScore
};

