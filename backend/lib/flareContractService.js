/**
 * Backend Flare Contract Service
 * 
 * Centralized service to interact with PredictionDAOWithFlare contract on Flare Coston Testnet
 * Handles read-only operations for fetching predictions and oracle prices
 */

const { ethers } = require('ethers');
const flareDaoAbi = require('./abi/flareDaoAbi.json');

// === Configuration ===
const FLARE_RPC_URL = process.env.FLARE_RPC_URL || 'https://coston-api.flare.network/ext/bc/C/rpc';
const FLARE_DAO_ADDRESS = process.env.FLARE_DAO_ADDRESS || '0x5A6613fb3effF1405FeE5ab1d7C6D924b8d1bF4C';
const FLARE_CHAIN_ID = 16; // Flare Coston Testnet

// === Provider (read-only) ===
let provider = null;
let flareDao = null;

/**
 * Initialize the Flare contract client
 * This creates a read-only connection to the Flare contract
 */
function initializeFlareClient() {
  try {
    provider = new ethers.JsonRpcProvider(FLARE_RPC_URL);
    flareDao = new ethers.Contract(FLARE_DAO_ADDRESS, flareDaoAbi, provider);
    console.log('✅ Flare DAO client initialized');
    console.log('   Address:', FLARE_DAO_ADDRESS);
    console.log('   Network: Flare Coston (ChainId:', FLARE_CHAIN_ID + ')');
  } catch (error) {
    console.error('❌ Failed to initialize Flare DAO client:', error.message);
  }
}

// Initialize on module load
initializeFlareClient();

// === Read-only Functions ===

/**
 * Get all active predictions from the contract
 */
async function getActivePredictions() {
  try {
    if (!flareDao) throw new Error('Flare DAO client not initialized');
    
    const predictionIds = await flareDao.getActivePredictions();
    const predictions = [];
    
    for (const id of predictionIds) {
      const pred = await getPredictionById(id);
      if (pred) predictions.push(pred);
    }
    
    console.log(`✅ Fetched ${predictions.length} active predictions from Flare contract`);
    return predictions;
  } catch (error) {
    console.error('❌ Error fetching active predictions:', error.message);
    return [];
  }
}

/**
 * Get all predictions from the contract
 */
async function getAllPredictions() {
  try {
    if (!flareDao) throw new Error('Flare DAO client not initialized');
    
    const predictionIds = await flareDao.getAllPredictions();
    const predictions = [];
    
    for (const id of predictionIds) {
      const pred = await getPredictionById(id);
      if (pred) predictions.push(pred);
    }
    
    console.log(`✅ Fetched ${predictions.length} total predictions from Flare contract`);
    return predictions;
  } catch (error) {
    console.error('❌ Error fetching all predictions:', error.message);
    return [];
  }
}

/**
 * Get a single prediction by ID
 */
async function getPredictionById(predictionId) {
  try {
    if (!flareDao) throw new Error('Flare DAO client not initialized');
    
    const predTuple = await flareDao.getPrediction(predictionId);
    
    // Convert to object format
    const prediction = {
      id: predTuple.id.toString(),
      creator: predTuple.creator,
      title: predTuple.title,
      description: predTuple.description,
      category: predTuple.category,
      assetSymbol: predTuple.assetSymbol,
      endTime: predTuple.endTime.toString(),
      isActive: predTuple.isActive,
      isApproved: predTuple.isApproved,
      totalVotes: predTuple.totalVotes.toString(),
      yesVotes: predTuple.yesVotes.toString(),
      noVotes: predTuple.noVotes.toString(),
      createdAt: predTuple.createdAt.toString(),
      // === Flare FTSO Fields ===
      refPriceAtSubmission: predTuple.refPriceAtSubmission.toString(),
      priceTimestamp: predTuple.priceTimestamp.toString(),
      priceDecimals: predTuple.priceDecimals,
      priceSourceIsFTSO: predTuple.priceSourceIsFTSO,
      // === Staking Fields ===
      stakedAmount: predTuple.stakedAmount.toString(),
      stakeTokenAddress: predTuple.stakeTokenAddress,
    };
    
    return prediction;
  } catch (error) {
    console.error(`❌ Error fetching prediction ${predictionId}:`, error.message);
    return null;
  }
}

/**
 * Get latest oracle price for an asset symbol
 * This calls the getLatestAssetPrice() function on the contract
 * 
 * @param {string} assetSymbol - e.g., "BTC", "ETH", "FLR", "XRP"
 * @returns {Object} { price, decimals, timestamp } or null if not available
 */
async function getLatestAssetPrice(assetSymbol) {
  try {
    if (!flareDao) throw new Error('Flare DAO client not initialized');
    
    console.log(`🔍 Fetching Flare FTSO price for ${assetSymbol}...`);
    
    const priceResult = await flareDao.getLatestAssetPrice(assetSymbol);
    
    const result = {
      price: priceResult.price.toString(),
      decimals: priceResult.decimals,
      timestamp: priceResult.timestamp.toString(),
      symbol: assetSymbol,
      source: 'Flare FTSO',
    };
    
    console.log(`✅ Got ${assetSymbol} price:`, result);
    return result;
  } catch (error) {
    // FTSO contract not set is a graceful error (expected in demo)
    if (error.message.includes('FTSO contract not set')) {
      console.warn(`⚠️  FTSO contract not set for ${assetSymbol} (demo mode)`);
      return null;
    }
    console.error(`❌ Error fetching price for ${assetSymbol}:`, error.message);
    return null;
  }
}

/**
 * Format a price from contract (uint256 with decimals) to human-readable
 */
function formatPrice(priceValue, decimals = 8) {
  try {
    const price = ethers.formatUnits(priceValue, decimals);
    return parseFloat(price).toFixed(2);
  } catch (error) {
    console.error('Error formatting price:', error.message);
    return '0.00';
  }
}

/**
 * Health check - verify contract is accessible
 */
async function isContractAvailable() {
  try {
    if (!provider || !flareDao) return false;
    
    // Try a simple read call
    await provider.getBlockNumber();
    return true;
  } catch (error) {
    console.error('❌ Flare contract health check failed:', error.message);
    return false;
  }
}

// === Exports ===
module.exports = {
  initializeFlareClient,
  getActivePredictions,
  getAllPredictions,
  getPredictionById,
  getLatestAssetPrice,
  formatPrice,
  isContractAvailable,
  // For testing/debugging
  provider,
  flareDao: () => flareDao,
};
