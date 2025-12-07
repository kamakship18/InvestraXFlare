# 🔥 Flare Integration - Development Notes

## Current Status Analysis

### ✅ What Exists

1. **Smart Contract**: `PredictionDAOWithFlare.sol`
   - FTSO integration for price feeds
   - FXRP staking functionality
   - Enhanced prediction struct with Flare fields

2. **Deployment Script**: `contracts/scripts/deploy-flare.js`
   - Configured for Flare Coston2 testnet
   - Saves deployment info to JSON

3. **Frontend Components**:
   - `FlareIntegration.jsx` - UI component for FTSO + FXRP
   - `flareConfig.js` - Network configuration

4. **Backend Services**:
   - `scraper.js` - Web scraping utility
   - `aiValidation.js` - AI validation with Perplexity
   - `validationRoutes.js` - API endpoint for validation

### ❌ What's Missing/Broken

1. **Contract Not Deployed**
   - No deployment artifacts found
   - Contract address not set in frontend config

2. **Frontend Not Using Flare Contract**
   - `create-prediction.js` submits to backend API, not directly to Flare contract
   - `FlareIntegration` component exists but not integrated into prediction form

3. **Backend Using Old Contract**
   - `daoRoutes.js` uses old `PredictionDAO` ABI, not `PredictionDAOWithFlare`
   - Missing Flare-specific fields (assetSymbol, stakeAmount) in API

4. **Missing Contract ABI**
   - Frontend needs Flare contract ABI
   - Backend needs updated ABI with Flare functions

5. **FTSO Addresses Not Set**
   - Contract has placeholder FTSO addresses (0x0)
   - Need real FTSO contract addresses for Coston2

6. **FXRP Token Address Not Set**
   - Contract has placeholder FXRP address (0x0)
   - Need real FXRP testnet address

---

## Implementation Plan

### Step 1: Deploy Flare Contract ✅ COMPILED
- [x] Check/install dependencies in contracts folder
- [x] Fix OpenZeppelin v5 compatibility (ReentrancyGuard path, Ownable constructor)
- [x] Fix Solidity version (0.8.20) and enable viaIR for stack too deep
- [x] Compile contract successfully
- [ ] Create .env file with PRIVATE_KEY (if needed)
- [ ] Deploy to Flare Coston2 testnet
- [ ] Save deployment address

### Step 2: Extract Contract ABI ✅ READY
- [x] Compile contract to get ABI
- [x] ABI available at: `contracts/artifacts/contracts/PredictionDAOWithFlare.sol/PredictionDAOWithFlare.json`
- [ ] Save ABI to frontend and backend

### Step 3: Update Backend
- [ ] Update daoRoutes.js to use Flare contract
- [ ] Add assetSymbol and stakeAmount to API
- [ ] Update contract service to use Flare contract address

### Step 4: Update Frontend
- [ ] Add Flare contract ABI
- [ ] Integrate FlareIntegration component into create-prediction page
- [ ] Wire prediction submission to use Flare contract directly
- [ ] Add web scraping + AI validation call

### Step 5: Set FTSO Addresses
- [ ] Find real FTSO contract addresses for Coston2
- [ ] Call setFTSOContract() for each asset

### Step 6: Testing
- [ ] Test contract deployment
- [ ] Test FTSO price fetching
- [ ] Test FXRP staking flow
- [ ] Test web scraping + AI validation
- [ ] Test end-to-end prediction creation

---

## Deployment Information

### Network: Flare Coston2 Testnet
- Chain ID: 114
- RPC: https://coston2-api.flare.network/ext/bc/C/rpc
- Explorer: https://coston2-explorer.flare.network
- Faucet: https://faucet.towolabs.com/

### Contract Addresses
- PredictionDAOWithFlare: `TBD` (after deployment)
- FXRP Token: `TBD` (need to find testnet address)
- FTSO Contracts: `TBD` (need to find for each asset)

---

## Known Limitations

1. **FXRP Token**: May not be available on Coston2 testnet. For demo, we may need to:
   - Use a mock ERC20 token
   - Or skip FXRP staking and use native C2FLR

2. **FTSO Addresses**: Need to query Flare's ContractRegistry or use documentation to find real addresses

3. **Web Scraping**: Some sites may block scraping. Demo should use allowed sites or mock data.

---

## ✅ COMPLETED FIXES

### Contract Compilation Fixed
1. **Updated OpenZeppelin imports**: Changed from `security/ReentrancyGuard` to `utils/ReentrancyGuard` (v5 change)
2. **Updated Solidity version**: Changed from 0.8.19 to 0.8.20 to match OpenZeppelin v5 requirements
3. **Fixed Ownable constructor**: Added `Ownable(msg.sender)` to all constructors (v5 requirement)
4. **Fixed interface declarations**: Moved IFtsoV2 interface outside contract (Solidity requirement)
5. **Used OpenZeppelin IERC20**: Replaced custom interface with OpenZeppelin's IERC20
6. **Enabled viaIR**: Added `viaIR: true` to fix "stack too deep" errors
7. **Fixed PredictionDAO.sol imports**: Updated to use npm imports instead of GitHub URLs

**Result**: All contracts now compile successfully! ✅

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### Prerequisites
1. Get testnet tokens from [Flare Faucet](https://faucet.towolabs.com/)
2. Have a wallet with C2FLR tokens for gas

### Deploy Contract

```bash
cd contracts

# Create .env file (if it doesn't exist)
echo "PRIVATE_KEY=your_private_key_here" > .env

# Deploy to Flare Coston2
npx hardhat run scripts/deploy-flare.js --network coston2
```

After deployment, the script will:
- Save contract address to `deployments/flare-coston2.json`
- Print the contract address
- Provide next steps

### Update Frontend Config

After deployment, update `frontend/lib/flareConfig.js`:
```javascript
predictionContractAddress: '0x...' // Your deployed address
```

Or set environment variable:
```bash
NEXT_PUBLIC_FLARE_PREDICTION_CONTRACT=0x...
```

### Set FTSO Contract Addresses

After deployment, call `setFTSOContract()` for each asset:
```javascript
// Using ethers.js or web3
await contract.setFTSOContract("BTC", "0x..."); // Real FTSO address
await contract.setFTSOContract("ETH", "0x..."); // Real FTSO address
```

**Finding FTSO Addresses**: 
- Check Flare documentation: https://docs.flare.network/tech/ftso
- Query ContractRegistry on Coston2
- For demo, you can use placeholder addresses (price fetching will fail gracefully)

### FXRP Token Address

**Option 1**: If FXRP exists on Coston2, update contract constant:
- Find FXRP testnet address
- Update `FXRP_TOKEN_ADDRESS` in contract (requires redeployment)
- OR: Create a setter function (requires contract modification)

**Option 2**: For demo without FXRP:
- Use a mock ERC20 token
- Or modify contract to make staking optional (requires contract changes)

---

## 📋 NEXT STEPS

### Immediate (Before Demo)
1. **Deploy contract** using instructions above
2. **Extract ABI** from compiled artifact and save to:
   - `frontend/contract/flareDaoAbi.js`
   - `backend/contract/flareDaoAbi.js`
3. **Update frontend** `flareConfig.js` with deployed address
4. **Integrate FlareIntegration component** into `create-prediction.js`
5. **Update backend** `daoRoutes.js` to use Flare contract ABI

### Integration Tasks
1. Wire `FlareIntegration` component to prediction form
2. Add assetSymbol and stakeAmount to prediction submission
3. Call Flare contract `createPrediction()` from frontend
4. Display FTSO price and FXRP stake in prediction cards
5. Test web scraping + AI validation flow

### Testing Checklist
- [ ] Contract deployed successfully
- [ ] Frontend connects to Flare network
- [ ] FTSO price fetching works (or shows graceful fallback)
- [ ] FXRP approval flow works
- [ ] Prediction creation with stake succeeds
- [ ] Web scraping + AI validation works
- [ ] Prediction displays with Flare data

---

## 🎯 DEMO FLOW (For Judges)

1. **Connect Wallet** → Switch to Flare Coston2 Testnet
2. **Create Prediction** → 
   - Select asset (BTC, ETH, etc.)
   - See FTSO price displayed (or "Price unavailable" if FTSO not set)
   - Enter FXRP stake amount
   - Approve FXRP if needed
   - Add supporting URL (optional)
   - Click "Validate" → See AI validation score
3. **Submit Prediction** → 
   - Transaction includes FTSO price capture + FXRP stake
   - Wait for confirmation
4. **View Prediction** →
   - Shows FTSO price at submission
   - Shows staked FXRP amount
   - Shows AI validation score
   - Badge: "Powered by Flare (FTSO + FAssets)"

