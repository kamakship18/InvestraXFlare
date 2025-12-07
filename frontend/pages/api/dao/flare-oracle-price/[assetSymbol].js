/**
 * Next.js API Route - Proxy for Flare Oracle Price
 * Proxies requests to backend to avoid CORS issues
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { assetSymbol } = req.query;
    
    if (!assetSymbol) {
      return res.status(400).json({
        success: false,
        message: 'Asset symbol is required'
      });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5004';
    
    console.log(`[API] Fetching Flare oracle price for ${assetSymbol} from ${backendUrl}`);
    
    // Forward the request to the backend
    let response;
    try {
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      response = await fetch(
        `${backendUrl}/api/dao/flare-oracle-price/${assetSymbol}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.error('[API] Backend fetch error:', fetchError);
      
      // If backend is not available, return demo data
      if (fetchError.name === 'AbortError' || fetchError.code === 'ECONNREFUSED') {
        console.log('[API] Backend not available, returning demo data');
        return res.status(200).json({
          success: true,
          data: {
            assetSymbol: assetSymbol.toUpperCase(),
            price: (Math.random() * 50000 + 30000).toFixed(2),
            priceRaw: '0',
            decimals: 8,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            source: 'Demo Data (Backend not available)',
            available: true,
            isDemoData: true
          }
        });
      }
      
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Backend error response:', response.status, errorText);
      
      // If backend returns error, return demo data instead of failing
      return res.status(200).json({
        success: true,
        data: {
          assetSymbol: assetSymbol.toUpperCase(),
          price: (Math.random() * 50000 + 30000).toFixed(2),
          priceRaw: '0',
          decimals: 8,
          timestamp: Math.floor(Date.now() / 1000).toString(),
          source: 'Demo Data (Backend error)',
          available: true,
          isDemoData: true
        }
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('[API] Error in flare-oracle-price API:', error);
    
    // Always return a valid response, even on error (with demo data)
    const { assetSymbol } = req.query;
    res.status(200).json({
      success: true,
      data: {
        assetSymbol: assetSymbol?.toUpperCase() || 'UNKNOWN',
        price: (Math.random() * 50000 + 30000).toFixed(2),
        priceRaw: '0',
        decimals: 8,
        timestamp: Math.floor(Date.now() / 1000).toString(),
        source: 'Demo Data (Error fallback)',
        available: true,
        isDemoData: true
      }
    });
  }
}

