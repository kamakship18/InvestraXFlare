/**
 * Flare Network Configuration
 * Configuration for Flare Coston2 testnet integration
 */

// Flare Coston Testnet Configuration
export const FLARE_CONFIG = {
  networkName: 'Flare Coston Testnet',
  chainId: 16,
  rpcUrl: 'https://coston-api.flare.network/ext/bc/C/rpc',
  blockExplorer: 'https://coston-explorer.flare.network',
  
  // Contract addresses (update after deployment)
  predictionContractAddress: process.env.NEXT_PUBLIC_FLARE_PREDICTION_CONTRACT || '',
  fxrpTokenAddress: process.env.NEXT_PUBLIC_FLARE_FXRP_TOKEN || '0x0000000000000000000000000000000000000000', // TODO: Update with real FXRP address
  
  // FTSO Feed IDs (bytes21 format)
  // These are example feed IDs - update with actual FTSO feed IDs from Flare
  ftsoFeeds: {
    'BTC': '0x4254432d55534400000000000000000000000000000000000000000000000000', // BTC-USD (placeholder)
    'ETH': '0x4554482d55534400000000000000000000000000000000000000000000000000', // ETH-USD (placeholder)
    'FLR': '0x464c522d55534400000000000000000000000000000000000000000000000000', // FLR-USD (placeholder)
    'XRP': '0x5852502d55534400000000000000000000000000000000000000000000000000', // XRP-USD (placeholder)
  },
  
  // Network switching configuration for MetaMask
  networkParams: {
    chainId: '0x10', // 16 in hex
    chainName: 'Flare Coston Testnet',
    nativeCurrency: {
      name: 'CFLR',
      symbol: 'CFLR',
      decimals: 18
    },
    rpcUrls: ['https://coston-api.flare.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://coston-explorer.flare.network']
  }
};

/**
 * Switch MetaMask to Flare Coston2 network
 */
export async function switchToFlareNetwork() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected');
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: FLARE_CONFIG.networkParams.chainId }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add the network
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [FLARE_CONFIG.networkParams],
        });
      } catch (addError) {
        throw new Error('Failed to add Flare network to MetaMask');
      }
    } else {
      throw switchError;
    }
  }
}

/**
 * Check if connected to Flare Coston2
 */
export async function isConnectedToFlare() {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16) === FLARE_CONFIG.chainId;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
}

/**
 * Get current network name
 */
export async function getCurrentNetworkName() {
  if (typeof window === 'undefined' || !window.ethereum) {
    return 'Unknown';
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const id = parseInt(chainId, 16);
    
    if (id === FLARE_CONFIG.chainId) {
      return FLARE_CONFIG.networkName;
    }
    
    return `Network ${id}`;
  } catch (error) {
    return 'Unknown';
  }
}

export default FLARE_CONFIG;

