# 🔮 Inverstra: Building Trust in Financial Advice Through Community Verification

## 🌟 **Executive Summary**

Inverstra is the world's first financial forecasting platform powered by decentralized communities and real-time web verification. In an era where 70% of online financial advice remains unaccountable, we're transforming how investment predictions are created, validated, and consumed—moving from viral, unchecked "finfluencer" content to a transparent, community-governed ecosystem.

## ❓ Problem Statement

In the world of finance, there's a growing distrust in self-proclaimed “finfluencers” spreading misleading or unaudited investment advice on social media. Most platforms lack transparency, verification, or accountability for these predictions — leading to misinformation and financial losses.

> 🔧 **We aim to solve this by:**
- ✅ Creating a **fully decentralized platform** where verified communities govern predictions, not corporations or individual influencers.A platform where predictions are verified and approved by **communities (DAOs)**.
- ✅ Using **AI** to explain and validate reasoning behind investment ideas.
- ✅ Ensuring **transparency, credibility, and decentralization** in financial forecasting.

## 🚀 **Technology Stack**

- **Frontend:** Next.js, React, Tailwind CSS, Shadcn UI
- **Backend:** Node.js, Express.js, RESTful APIs
- **Database:** MongoDB Atlas (document storage, user profiles)
- **Web3:** Ethereum & **Flare Network**, MetaMask, Ethers.js v6, Solidity (Smart Contracts)
- **Oracles:** **Flare FTSO (Flare Time Series Oracle)** for real-time asset prices
- **Authentication:** Wallet-based auth (MetaMask integration)
- **Verification:** Web scraping system for market data verification and source credibility

## 🔄 **User Flows & Experience**

### **Complete User Journey**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Visits   │───▶│  MetaMask       │───▶│  Role Selection │───▶│  Profile Setup  │
│   Website       │    │  Connection     │    │  (Learner/      │    │  (Investment    │
│                 │    │                 │    │   Expert/       │    │   Preferences)  │
│                 │    │                 │    │   Verifier)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Expert Flow**
As an expert/influencer:

1. **Wallet Connection & Profile**
   - Connect wallet for on-chain accountability
   - Dashboard displays prediction history and credibility score

2. **Create Prediction**
   - Enter financial values with clear reasoning
   - Upload supporting evidence (documents, charts)
   - System requires evidence, not guesswork

3. **Verification Process**
   - Web scraping verification reviews prediction and data
   - Assigns validation score (minimum 70/100 required)
   - Predictions sent anonymously to DAO community
   - 70% supermajority required for publication
   
4. **Feedback & Rewards**
   - Approved predictions go live and earn tokens
   - Rejected predictions receive private feedback
   - Reputation builds with successful predictions

### **Learner Flow**
As a user/learner:

1. **Wallet Connection & Profile**
   - Join with wallet and set preferences
   - Receive 20 initial tokens
   
2. **Dashboard Experience**
   - View curated, verified predictions
   - Spend 2 tokens to unlock detailed predictions
   - Access personalized insights based on preferences

3. **Token Economy**
   - Earn through daily logins and engagement
   - Pay for premium content with tokens
   - Track prediction performance


### **DAO Verification Flow**
```
Prediction ──▶ Web Scraping ──▶ Data Collection ──▶ Web Data ──▶ Market Context ──▶ DAO Decision
     │              │               │               │              │               │
     ▼              ▼               ▼               ▼              ▼               ▼
┌─────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Submit  │ │ Analyze     │ │ Real-time   │ │ Market      │ │ Contextual  │ │ Informed    │
│ for     │ │ Credibility │ │ Web Scraping│ │ Data        │ │ Analysis    │ │ Voting      │
│ Voting  │ │ & Quality   │ │             │ │             │ │             │ │             │
└─────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```
## 💰 **Tokenomics & Economic Model**

Our platform operates on a scarce-token ecosystem that incentivizes quality contributions and thoughtful engagement:


| User Type | Starting Tokens | Token Usage | Earning Mechanism |
|-----------|----------------|-------------|-------------------|
| **Learners** | 20 tokens | 2 tokens per prediction unlock | Daily logins, engagement rewards |
| **Experts/Influencers** | 50 tokens | 10 tokens per prediction creation | 25 tokens per approved prediction, achievements |
| **DAO Members** | 30 tokens | 1 token per vote | Rewards for active, accurate participation |

This token-based economy ensures:
- Every action has a cost, reducing spam and low-quality content
- Quality predictions are rewarded, creating positive reinforcement
- Active participation and accuracy build reputation and wealth
- All transactions are governed by transparent, auditable smart contracts

## 🌟 **Competitive Edge & Unique Value**

| Platform | Verification Method | Accountability | Governance |
|----------|---------------------|----------------|------------|
| **Instagram/TikTok** | None (virality-driven) | None | Centralized |
| **Financial Forums** | Moderator review | Limited | Centralized |
| **Reddit/Discord** | Community voting | Pseudonymous | Semi-decentralized |
| **Inverstra** | Triple validation: Web verification + Source checking + DAO voting | Wallet-linked, on-chain | Fully decentralized |

**Our Web3 Advantage:**
- Predictions are immutable and blockchain-verified
- Reputation is earned through verifiable actions, not follower count
- Communities have actual governance power through DAOs
- Token economics reward accuracy and quality, not virality

## 🧪 **Features Completed for HackIndia**

- ✅ **Wallet Integration:** MetaMask connection with account persistence
- ✅ **Multi-Role System:** Distinct flows for experts, learners, and DAO members
- ✅ **Dynamic Dashboard:** Personalized prediction feed with modern UI
- ✅ **Verification System:** Web scraping verification for data accuracy
- ✅ **DAO Governance:** Community voting mechanism with supermajority requirements
- ✅ **Token Economy:** Fully implemented token distribution and spending system
- ✅ **Smart Contracts:** PredictionDAO.sol with voting and governance functions
- ✅ **MongoDB Integration:** Complete user profile and prediction storage

## 🔥 **Flare Network Integration**

InvestraXFlare now integrates **Flare Network's decentralized oracle infrastructure** to provide transparent, real-time asset price feeds for predictions:

**What Flare Brings:**
- ✅ **FTSO (Flare Time Series Oracle):** Decentralized price feeds for BTC, ETH, XRP, and other assets
- ✅ **On-Chain Predictions:** All predictions stored on Flare Coston Testnet with immutable oracle prices
- ✅ **Smart Contract Validation:** Predictions include reference prices at submission time, preventing tampering
- ✅ **Decentralized Governance:** Removes dependency on centralized price providers

**Technical Details:**
- **Contract Address:** `0xd4f877b49584ba9777DBEE27e450bD524193B2f0`
- **Network:** Flare Coston Testnet (chainId: 16)
- **Smart Contract:** `PredictionDAOWithFlare.sol` with FTSO integration
- **Backend Service:** `/backend/lib/flareContractService.js` provides read-only contract access
- **API Endpoints:**
  - `GET /api/dao/flare-oracle-price/:assetSymbol` - Real-time FTSO prices
  - `GET /api/dao/predictions/all-with-flare` - Predictions with oracle data
  - `GET /api/dao/contract-status` - Health check

**User Experience:**
- ⚡ **Oracle Price Widget:** Purple-themed UI component shows live Flare FTSO prices
- 📊 **Prediction Submission:** When creating predictions, asset prices are captured from FTSO oracle
- 🔗 **Explorer Verification:** Transaction hashes logged to Flare Coston Explorer for transparency

## 🛠️ **Project Setup Instructions**

### Frontend Setup
```bash
git clone https://github.com/your-username/inverstra.git
cd inverstra/frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd ../backend
npm install
npm start  # Runs on http://localhost:5000
```

### Blockchain Setup (Flare Integration)
```bash
cd ../contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy-flare.js --network coston  # Deploy to Flare Coston Testnet
```

**Requirements:**
- Node.js v16+
- MetaMask browser extension with Flare Coston Testnet added
- Testnet CFLR tokens (request from Flare faucet)

**For Flare Coston Testnet:**
- Add network to MetaMask: https://docs.flare.network/user/getting-started/testnet/
- RPC URL: https://coston-api.flare.network/ext/bc/C/rpc
- Chain ID: 16

## 🌐 **Impact & Vision**

Inverstra isn't just a platform—it's a movement to transform how financial advice is created and consumed in India and beyond. By building trust through transparency and community governance, we're creating a future where:

- Young investors have access to reliable, verified financial guidance
- Financial literacy becomes accessible without the risk of misinformation
- Communities, not algorithms or influencers, determine what advice is trustworthy
- Accountability becomes the standard in financial content creation

What started as a hackathon project has grown into a community-powered solution redefining trust in financial advice. 

## 👥 **Team**

Our diverse team combines expertise in blockchain development, UI/UX design, financial markets, and community building:

- **Kamakshi Pandoh** - Full Stack Developer & Project Lead
- **Chirag Sareen** - Blockchain Developer
