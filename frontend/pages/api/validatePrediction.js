/**
 * API Route: /api/validatePrediction
 * 
 * Validates a prediction using web scraping + AI sentiment analysis
 * 
 * Request body:
 * {
 *   predictionText: string,
 *   assetSymbol: string,
 *   supportingUrl?: string (optional)
 * }
 * 
 * Response:
 * {
 *   validationScore: number (0-100),
 *   sentimentLabel: string,
 *   articleSummary: string,
 *   articleCredibility: number (0-100),
 *   supportingUrlUsed: boolean
 * }
 */

// Import server-side modules (these will be handled by Next.js API routes)
// Note: We'll need to use dynamic imports or move this to backend

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { predictionText, assetSymbol, supportingUrl } = req.body;

    if (!predictionText || !assetSymbol) {
      return res.status(400).json({
        error: 'Missing required fields: predictionText and assetSymbol are required'
      });
    }

    // Forward to backend API for processing
    // (We'll implement the actual scraping logic in the backend)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5004';
    
    const response = await fetch(`${backendUrl}/api/validate-prediction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        predictionText,
        assetSymbol,
        supportingUrl
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const result = await response.json();
    res.status(200).json(result);

  } catch (error) {
    console.error('Error in validatePrediction API:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

