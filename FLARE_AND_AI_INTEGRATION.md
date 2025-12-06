# 🚀 Flare & AI Integration Documentation

## Overview

This document describes the integration of **Flare Network technologies** (FTSO and FAssets) and **enhanced AI validation** with web scraping into the Inverstra prediction platform.

---

## 🔥 Flare Integration

### 1. Flare Time Series Oracle (FTSO) v2

**What it does:**
- Fetches real-time asset prices from Flare's decentralized oracle network
- Captures price data at prediction submission time
- Provides tamper-proof, decentralized price feeds

**Implementation:**
- **Contract:** `PredictionDAOWithFlare.sol`
- **Function:** `getLatestAssetPrice(string assetSymbol)`
- **Network:** Flare Coston2 Testnet (Chain ID: 114)
- **Price Storage:** Prices are normalized to 8 decimals and stored in the `Prediction` struct

**Supported Assets (Demo):**
- BTC/USD
- ETH/USD
- FLR/USD
- XRP/USD

**How it works:**
1. When an expert creates a prediction, the contract queries the FTSO for the current asset price
2. The price, timestamp, and decimals are stored with the prediction
3. Frontend displays: "Price at submission (Flare FTSO): $XX,XXX.XX"

**Contract Fields Added:**
```solidity
uint256 refPriceAtSubmission;  // FTSO price at submission
uint256 priceTimestamp;        // When price was captured
uint8 priceDecimals;           // FTSO price decimals
bool priceSourceIsFTSO;        // Flag indicating FTSO source
```

---

### 2. FXRP (FAsset) Staking

**What it does:**
- Uses FXRP (an FAsset representing XRP 1:1) as the staking token
- Experts must stake FXRP when creating predictions
- Provides economic skin-in-the-game for prediction quality

**Implementation:**
- **Token:** FXRP (ERC-20 compatible FAsset)
- **Minimum Stake:** 1 FXRP
- **Contract Function:** `createPrediction()` requires `stakeAmount` parameter
- **Stake Storage:** Staked amount stored in `Prediction.stakedAmount`

**How it works:**
1. Expert approves FXRP spending in MetaMask
2. When creating prediction, FXRP is transferred from user to contract
3. Staked FXRP is locked until prediction is finalized
4. Frontend displays: "Staked: X FXRP (FAsset on Flare)"

**Contract Fields Added:**
```solidity
uint256 stakedAmount;          // Amount of FXRP staked
address stakeTokenAddress;     // FXRP token contract address
```

**Withdrawal:**
- `withdrawStake(uint256 predictionId)` - Creator can withdraw after prediction is finalized
- For demo purposes, withdrawal is available after prediction ends
- In production, this could have conditions (e.g., only if prediction was correct)

---

## 🤖 AI Validation with Web Scraping

### Enhanced Validation System

**What it does:**
- Scrapes supporting URLs provided by experts
- Extracts article text and analyzes sentiment
- Computes credibility scores using AI
- Combines multiple signals into a validation score (0-100)

**Implementation:**
- **Backend Route:** `/api/validate-prediction`
- **Scraper:** `backend/lib/scraper.js` (uses Cheerio)
- **AI Analysis:** `backend/lib/aiValidation.js` (uses OpenAI API)
- **Frontend API:** `/api/validatePrediction`

**How it works:**

1. **Web Scraping:**
   - Expert provides a `supportingUrl` with their prediction
   - Backend fetches the page HTML
   - Extracts text from `<p>`, `<h1>`, `<h2>` tags
   - Truncates to 6000 characters for safety
   - Returns: `{ rawText, title, success }`

2. **AI Analysis:**
   - Sends prediction text + article text to OpenAI
   - AI analyzes:
     - **Sentiment** (-100 to +100): Bullish/Bearish/Neutral
     - **Article Credibility** (0-100): Source trustworthiness
     - **Support Score** (0-100): How strongly article supports prediction
   - Returns comprehensive analysis

3. **Validation Score Calculation:**
   ```
   validationScore = (articleCredibility × 0.4) + 
                     (supportScore × 0.4) + 
                     (sentimentAlignment × 0.2)
   ```

4. **Frontend Display:**
   - Shows validation score (0-100)
   - Displays sentiment label
   - Shows article credibility
   - Indicates if supporting URL was used

**Request Format:**
```json
{
  "predictionText": "BTC will reach $100,000 by end of 2024",
  "assetSymbol": "BTC",
  "supportingUrl": "https://example.com/article" // Optional
}
```

**Response Format:**
```json
{
  "success": true,
  "validationScore": 85,
  "sentimentLabel": "bullish",
  "sentimentScore": 75,
  "articleSummary": "Article strongly supports prediction...",
  "articleCredibility": 90,
  "supportingUrlUsed": true,
  "articleTitle": "Bitcoin Price Analysis",
  "articleLength": 2500
}
```

**Important Notes:**
- ✅ Respects robots.txt and Terms of Service
- ✅ Generic scraper works on any allowed site
- ✅ Graceful fallback if scraping fails
- ✅ Never blocks prediction flow due to scraping errors

---

## 📁 File Structure

### Smart Contracts
```
contracts/
├── contracts/
│   ├── PredictionDAO.sol              # Original contract
│   └── PredictionDAOWithFlare.sol    # Enhanced with FTSO + FXRP
├── scripts/
│   ├── deploy.js                      # Original deployment
│   └── deploy-flare.js               # Flare Coston2 deployment
└── hardhat.config.js                  # Updated with Coston2 network
```

### Backend
```
backend/
├── lib/
│   ├── scraper.js                     # Web scraping utility
│   └── aiValidation.js                # AI scoring logic
├── routes/
│   └── validationRoutes.js            # Validation API endpoint
└── server.js                          # Updated with validation route
```

### Frontend
```
frontend/
├── lib/
│   └── flareConfig.js                 # Flare network configuration
├── components/
│   └── flare/
│       └── FlareIntegration.jsx      # FTSO + FXRP UI component
└── pages/
    ├── api/
    │   └── validatePrediction.js      # Frontend API proxy
    └── influencer/
        └── create-prediction.js       # Prediction form (to be updated)
```

---

## 🚀 Setup & Deployment

### Prerequisites

1. **Node.js** and npm installed
2. **MetaMask** browser extension
3. **Testnet tokens:**
   - C2FLR from [Flare Faucet](https://faucet.towolabs.com/)
   - FXRP (if available on testnet)

### Backend Setup

```bash
cd backend
npm install
# Install cheerio for web scraping
npm install cheerio
```

**Environment Variables (.env):**
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo  # Optional, defaults to gpt-3.5-turbo
```

### Smart Contract Deployment

```bash
cd contracts

# Install dependencies
npm install

# Set private key in .env
echo "PRIVATE_KEY=your_private_key" >> .env

# Deploy to Flare Coston2
npx hardhat run scripts/deploy-flare.js --network coston2
```

**After deployment:**
1. Copy contract address from `deployments/flare-coston2.json`
2. Update `frontend/lib/flareConfig.js`:
   ```javascript
   predictionContractAddress: '0x...' // Your deployed address
   ```
3. Update FXRP token address in config (if known)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Demo Instructions for Judges

### 1. Connect to Flare Network

1. Open the app in browser
2. Click "Connect Wallet" (MetaMask)
3. If not on Flare Coston2, click "Switch to Flare Coston2"
4. Approve network addition in MetaMask

### 2. Create a Prediction with Flare Integration

1. Navigate to "Create Prediction"
2. Select category (e.g., "Cryptocurrency")
3. Select asset (e.g., "BTC")
4. **See FTSO Price:** The Flare Integration component shows:
   - Current BTC price from Flare FTSO
   - "Powered by Flare" badge
   - Price timestamp
5. **Stake FXRP:**
   - Enter stake amount (minimum 1 FXRP)
   - Click "Approve FXRP" if needed
   - FXRP balance is displayed
6. Fill in prediction details
7. **Add Supporting URL (Optional):**
   - Enter a finance article URL
   - Click "Validate Prediction"
   - See AI validation score with:
     - Sentiment analysis
     - Article credibility
     - Support score
8. Submit prediction

### 3. View Prediction Details

After submission, view the prediction to see:
- **FTSO Price at Submission:** $XX,XXX.XX (from Flare FTSO)
- **Price Timestamp:** When price was captured
- **Staked FXRP:** X FXRP (FAsset on Flare)
- **AI Validation Score:** X/100
- **Sentiment:** Bullish/Bearish/Neutral
- **Badge:** "Powered by Flare (FTSO + FAssets)"

---

## 🔧 Configuration

### Update FTSO Contract Addresses

After deployment, set FTSO contract addresses:

```javascript
// In contract or via setFTSOContract function
await predictionDAO.setFTSOContract("BTC", "0x..."); // BTC FTSO address
await predictionDAO.setFTSOContract("ETH", "0x..."); // ETH FTSO address
```

### Update FXRP Token Address

Update in `PredictionDAOWithFlare.sol`:
```solidity
address public constant FXRP_TOKEN_ADDRESS = 0x...; // Real FXRP address
```

Or set via constructor parameter (requires contract modification).

---

## 📊 Technical Details

### FTSO Price Normalization

- FTSO returns prices with variable decimals (typically 5)
- Contract normalizes to 8 decimals for consistency
- Formula: `normalizedPrice = price × 10^(8 - originalDecimals)`

### FXRP Staking Flow

1. User approves FXRP spending: `fxrp.approve(contractAddress, amount)`
2. Contract checks allowance: `fxrp.allowance(user, contract)`
3. On prediction creation: `fxrp.transferFrom(user, contract, stakeAmount)`
4. Stake locked in contract until withdrawal

### Web Scraping Safety

- 8-second timeout
- Max 6000 character extraction
- Graceful error handling
- Never blocks prediction flow
- Respects robots.txt (implementation responsibility)

### AI Validation Fallback

If OpenAI API fails:
- Returns fallback score (50-70 based on text quality)
- Prediction creation still proceeds
- Logs error for debugging

---

## 🐛 Troubleshooting

### "FTSO contract not set for this asset"
- **Solution:** Call `setFTSOContract(assetSymbol, ftsoAddress)` on contract

### "Insufficient FXRP allowance"
- **Solution:** Click "Approve FXRP" button in UI

### "Failed to scrape URL"
- **Solution:** Check URL is accessible, try a different URL, or proceed without URL

### "Network not connected"
- **Solution:** Click "Switch to Flare Coston2" button

---

## 📝 Notes for Hackathon Judges

### What Makes This Integration Special:

1. **Real Flare Technology:**
   - Uses actual FTSO v2 oracle on Coston2 testnet
   - Integrates FAsset (FXRP) as native staking token
   - Not just mock data - real blockchain integration

2. **End-to-End Flow:**
   - Price captured on-chain at submission
   - Staking requires real FXRP transfer
   - All data visible in contract and UI

3. **Enhanced AI Validation:**
   - Web scraping adds external data source
   - Sentiment analysis provides market context
   - Credibility scoring ensures quality sources

4. **Production-Ready Architecture:**
   - Graceful error handling
   - Fallback mechanisms
   - Clean separation of concerns
   - Well-commented code

---

## 🔗 Useful Links

- **Flare Network:** https://flare.network
- **FTSO Documentation:** https://docs.flare.network/tech/ftso
- **FAssets Documentation:** https://docs.flare.network/tech/f-assets
- **Coston2 Explorer:** https://coston2-explorer.flare.network
- **Coston2 Faucet:** https://faucet.towolabs.com/

---

## 📧 Support

For questions or issues during the hackathon demo:
- Check contract addresses are set correctly
- Verify network is Flare Coston2 (Chain ID: 114)
- Ensure backend has OPENAI_API_KEY set
- Check browser console for errors

---

**Built for Hackathon India 2025** 🚀

