# 🔥 Quick Flare Integration Testing Guide

**For judges, reviewers, and developers testing Flare integration in InvestraXFlare**

---

## 🚀 **5-Minute Quick Start**

### Step 1: Start the Backend
```bash
cd backend
npm install  # If needed
npm start
```
Expected: `Server running on port 5000`

### Step 2: Start the Frontend
```bash
cd frontend
npm install  # If needed
npm run dev
```
Expected: `Ready on http://localhost:3000`

### Step 3: View Flare Oracle Price Widget
Open: **http://localhost:3000/dao/dashboard**

**You should see:**
- Purple card with "⚡ Flare FTSO Oracle" title
- Asset symbol dropdown (BTC, ETH, XRP, etc.)
- Large price display: `$42,500.00`
- "Powered by Flare" badge
- Source: "Flare FTSO (Coston2)" or "📊 Demo Data"

---

## 🧪 **Test Scenarios**

### Test 1: Verify Backend API is Serving Flare Data

**Command:**
```bash
curl http://localhost:5000/api/dao/contract-status
```

**Expected Output:**
```json
{
  "status": "healthy",
  "contractAddress": "0xd4f877b49584ba9777DBEE27e450bD524193B2f0",
  "network": "Flare Coston Testnet"
}
```

**✅ Pass:** Returns healthy status  
**❌ Fail:** Returns error or timeout

---

### Test 2: Fetch Oracle Price

**Command:**
```bash
curl http://localhost:5000/api/dao/flare-oracle-price/BTC
```

**Expected Output:**
```json
{
  "price": 42500.50,
  "decimals": 8,
  "timestamp": 1702012345,
  "source": "Flare FTSO (Coston2)",
  "isDemoData": false
}
```

**Or if FTSO not configured (graceful fallback):**
```json
{
  "price": 42500.00,
  "decimals": 8,
  "source": "Flare FTSO (Coston2)",
  "isDemoData": true,
  "message": "Using demo data - FTSO contracts not configured on testnet"
}
```

**✅ Pass:** Returns either real or demo price data  
**❌ Fail:** Returns 500 error or broken JSON

---

### Test 3: View Flare Price in UI

**Steps:**
1. Open http://localhost:3000/dao/dashboard
2. **Look for purple card titled "⚡ Flare FTSO Oracle"**
3. Click asset dropdown and select **BTC**
4. **Watch for:**
   - Loading spinner briefly
   - Price number appears (real or demo)
   - "Powered by Flare" badge visible
   - Source shows "Flare FTSO" or "Demo Data"

**✅ Pass:** Price displays without errors  
**❌ Fail:** Card shows error, or blank price

---

### Test 4: Create Prediction on Flare Contract

**Prerequisites:**
- MetaMask installed and unlocked
- Connected to Flare Coston Testnet
- Have some CFLR for gas fees

**Steps:**
1. Navigate to: http://localhost:3000/influencer/create-prediction
2. Click "Connect Wallet" button
3. Approve MetaMask connection
   - **MetaMask will auto-switch to Flare Coston (chainId 16)**
4. Fill form:
   ```
   Title: "BTC will hit $50k by Dec 31"
   Description: "Based on current momentum"
   Category: "Crypto"
   Asset Symbol: BTC
   Voting Period: 7 days
   Stake Amount: 10 FXRP
   ```
5. Click **"Create Prediction"**
6. MetaMask will popup → Click **"Confirm"**
7. Wait for transaction...

**Success Indicators:**
- ✅ Toast notification: "Creating prediction on Flare..."
- ✅ MetaMask shows transaction hash
- ✅ Browser console shows: `Transaction sent: 0x...`
- ✅ Within 30 seconds: "Prediction created successfully!"

**❌ If it fails:**
- Check MetaMask is on Flare Coston (chainId 16)
- Check you have CFLR for gas
- Check backend is running (`npm start`)
- Check browser console for errors

---

### Test 5: Verify Transaction on Flare Explorer

**After creating a prediction:**
1. Copy transaction hash from browser console or MetaMask
2. Open: https://coston2-explorer.flare.network/
3. Paste transaction hash in search
4. Click result
5. **Verify:**
   - ✅ "To" address: `0xd4f877b49584ba9777DBEE27e450bD524193B2f0`
   - ✅ Function: `createPrediction(title, asset, stake, duration)`
   - ✅ Status: `Success` (green checkmark)

---

### Test 6: Get All Predictions with Flare Data

**Command:**
```bash
curl http://localhost:5000/api/dao/predictions/all-with-flare | jq .
```

**Expected Output:**
```json
[
  {
    "id": 1,
    "title": "BTC will hit $50k by Dec 31",
    "refPriceAtSubmission": "4250000000000",
    "priceTimestamp": 1702012345,
    "priceSourceIsFTSO": true,
    "stakedAmount": "10000000000000000000",
    "votingPeriod": 7,
    "status": "active"
  }
]
```

**✅ Pass:** Returns array with Flare fields  
**❌ Fail:** Returns empty array or errors

---

## 📍 **Key Flare Integration Points in UI**

### 1. **Dashboard** (http://localhost:3000/dao/dashboard)
   - **Component:** `FlareIntegration.jsx`
   - **What to see:** Purple "⚡ Flare FTSO Oracle" card with price
   - **Purpose:** Display real-time oracle prices

### 2. **Create Prediction** (http://localhost:3000/influencer/create-prediction)
   - **File:** `pages/influencer/create-prediction.js`
   - **What happens:** Form submits to Flare contract on-chain
   - **MetaMask:** Auto-switches to Coston (chainId 16)
   - **Purpose:** Record predictions immutably on blockchain

### 3. **Backend APIs** (http://localhost:5000/api/dao/...)
   - **Service:** `backend/lib/flareContractService.js`
   - **Endpoints:**
     - `/flare-oracle-price/:symbol` - Get FTSO price
     - `/predictions/all-with-flare` - Get predictions with oracle data
     - `/predictions/active-with-flare` - Get active predictions
     - `/contract-status` - Health check

---

## ⚙️ **Configuration**

### MetaMask - Add Flare Coston Testnet

**Network Details:**
- **Name:** Flare Coston Testnet
- **RPC URL:** https://coston-api.flare.network/ext/bc/C/rpc
- **Chain ID:** 16
- **Symbol:** CFLR
- **Block Explorer:** https://coston2-explorer.flare.network/

**Get Testnet Tokens:**
- Visit: https://faucet.flare.network/

### Environment Variables
**Backend (`backend/.env`):**
```
FLARE_RPC_URL=https://coston-api.flare.network/ext/bc/C/rpc
FLARE_CONTRACT_ADDRESS=0xd4f877b49584ba9777DBEE27e450bD524193B2f0
```

**Frontend (`frontend/.env.local`):**
```
NEXT_PUBLIC_FLARE_RPC_URL=https://coston-api.flare.network/ext/bc/C/rpc
NEXT_PUBLIC_FLARE_PREDICTION_CONTRACT=0xd4f877b49584ba9777DBEE27e450bD524193B2f0
NEXT_PUBLIC_FLARE_CHAIN_ID=16
```

---

## 🐛 **Troubleshooting**

| Issue | Cause | Solution |
|-------|-------|----------|
| MetaMask doesn't auto-switch to Flare | Network not in wallet | Add Flare Coston manually to MetaMask |
| "Contract not available" error | Backend can't reach RPC | Check `FLARE_RPC_URL` is correct |
| Oracle price shows only demo data | FTSO contracts not configured | This is normal - app gracefully falls back to demo |
| Transaction fails with "not enough gas" | Need CFLR tokens | Get from Flare faucet: https://faucet.flare.network/ |
| Frontend build error about imports | Missing ABI files | Run `git pull` to get `/lib/abi/flareDaoAbi.json` |
| Backend crashes on startup | Missing dependencies | Run `npm install` in backend folder |

---

## ✅ **Success Criteria Checklist**

For judges evaluating Flare integration:

- [ ] **Dashboard loads** → See "⚡ Flare FTSO Oracle" purple card
- [ ] **Price widget works** → Select BTC/ETH and see price display
- [ ] **Backend API responds** → `/api/dao/contract-status` returns healthy
- [ ] **Oracle prices fetch** → `/api/dao/flare-oracle-price/BTC` returns price
- [ ] **Form submission** → Can create prediction on Flare contract
- [ ] **MetaMask integration** → Auto-switches to Coston (chainId 16)
- [ ] **Transaction verification** → Can see tx on coston2-explorer.flare.network
- [ ] **Demo mode graceful** → If FTSO not configured, shows demo data with clear label
- [ ] **No errors in console** → Browser DevTools shows no JS errors

---

## 📞 **Support**

**For issues:**
1. Check browser console: F12 → Console tab
2. Check backend logs: terminal where `npm start` runs
3. Check MetaMask is connected to Flare Coston
4. Restart both frontend and backend

**Environment for testing:**
- Flare Coston Testnet (chainId: 16)
- Contract: `0xd4f877b49584ba9777DBEE27e450bD524193B2f0`
- RPC: https://coston-api.flare.network/ext/bc/C/rpc
- Explorer: https://coston2-explorer.flare.network/
