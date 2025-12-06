/**
 * Flare Integration Component
 * Displays FTSO price and FXRP staking UI for predictions
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Coins, TrendingUp } from 'lucide-react';
import FLARE_CONFIG, { switchToFlareNetwork, isConnectedToFlare } from '@/lib/flareConfig';
import { toast } from 'react-hot-toast';

// ERC20 ABI for FXRP token
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export default function FlareIntegration({ 
  assetSymbol, 
  onPriceFetched, 
  onStakeAmountChange,
  stakeAmount: externalStakeAmount,
  disabled = false 
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [ftsoPrice, setFtsoPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [fxrpBalance, setFxrpBalance] = useState(null);
  const [fxrpAllowance, setFxrpAllowance] = useState(null);
  const [stakeAmount, setStakeAmount] = useState(externalStakeAmount || '1');
  const [isApproving, setIsApproving] = useState(false);

  // Check network connection on mount
  useEffect(() => {
    checkNetwork();
  }, []);

  // Update stake amount when external value changes
  useEffect(() => {
    if (externalStakeAmount !== undefined) {
      setStakeAmount(externalStakeAmount);
    }
  }, [externalStakeAmount]);

  // Fetch FTSO price when asset symbol changes
  useEffect(() => {
    if (assetSymbol && isConnected) {
      fetchFTSOPrice();
    }
  }, [assetSymbol, isConnected]);

  // Check FXRP balance and allowance
  useEffect(() => {
    if (isConnected && FLARE_CONFIG.fxrpTokenAddress) {
      checkFXRPBalance();
      checkFXRPAllowance();
    }
  }, [isConnected, stakeAmount]);

  const checkNetwork = async () => {
    const connected = await isConnectedToFlare();
    setIsConnected(connected);
  };

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    try {
      await switchToFlareNetwork();
      await checkNetwork();
      toast.success('Switched to Flare Coston2 Testnet');
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network: ' + error.message);
    } finally {
      setIsSwitching(false);
    }
  };

  const fetchFTSOPrice = async () => {
    if (!assetSymbol || !isConnected) return;

    setPriceLoading(true);
    try {
      // In a real implementation, this would call the smart contract
      // For demo, we'll simulate or call a backend endpoint
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractAddress = FLARE_CONFIG.predictionContractAddress;
      
      if (!contractAddress) {
        // Fallback: Use backend API or mock data for demo
        console.log('Contract address not set, using mock FTSO price');
        // Mock price for demo
        const mockPrice = Math.random() * 50000 + 30000; // Random price between 30k-80k
        setFtsoPrice({
          price: mockPrice,
          decimals: 8,
          timestamp: Date.now()
        });
        if (onPriceFetched) {
          onPriceFetched(mockPrice, 8, Date.now());
        }
        return;
      }

      // TODO: Call contract's getLatestAssetPrice function
      // For now, we'll use a backend endpoint or mock
      toast.info('FTSO price fetching - using demo data');
      
    } catch (error) {
      console.error('Error fetching FTSO price:', error);
      toast.error('Failed to fetch FTSO price');
    } finally {
      setPriceLoading(false);
    }
  };

  const checkFXRPBalance = async () => {
    if (!window.ethereum || !FLARE_CONFIG.fxrpTokenAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const tokenContract = new ethers.Contract(
        FLARE_CONFIG.fxrpTokenAddress,
        ERC20_ABI,
        provider
      );

      const balance = await tokenContract.balanceOf(userAddress);
      const decimals = await tokenContract.decimals();
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      setFxrpBalance(formattedBalance);
    } catch (error) {
      console.error('Error checking FXRP balance:', error);
      // For demo, set a mock balance
      setFxrpBalance('100.0');
    }
  };

  const checkFXRPAllowance = async () => {
    if (!window.ethereum || !FLARE_CONFIG.fxrpTokenAddress || !FLARE_CONFIG.predictionContractAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const tokenContract = new ethers.Contract(
        FLARE_CONFIG.fxrpTokenAddress,
        ERC20_ABI,
        provider
      );

      const allowance = await tokenContract.allowance(userAddress, FLARE_CONFIG.predictionContractAddress);
      const decimals = await tokenContract.decimals();
      const formattedAllowance = ethers.formatUnits(allowance, decimals);
      
      setFxrpAllowance(formattedAllowance);
    } catch (error) {
      console.error('Error checking FXRP allowance:', error);
      setFxrpAllowance('0');
    }
  };

  const handleApproveFXRP = async () => {
    if (!window.ethereum || !FLARE_CONFIG.fxrpTokenAddress || !FLARE_CONFIG.predictionContractAddress) {
      toast.error('Network or contract not configured');
      return;
    }

    setIsApproving(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tokenContract = new ethers.Contract(
        FLARE_CONFIG.fxrpTokenAddress,
        ERC20_ABI,
        signer
      );

      const decimals = await tokenContract.decimals();
      const amount = ethers.parseUnits(stakeAmount || '1000', decimals); // Approve a large amount

      const tx = await tokenContract.approve(FLARE_CONFIG.predictionContractAddress, amount);
      await tx.wait();

      toast.success('FXRP approval successful');
      await checkFXRPAllowance();
    } catch (error) {
      console.error('Error approving FXRP:', error);
      toast.error('Failed to approve FXRP: ' + (error.message || 'Unknown error'));
    } finally {
      setIsApproving(false);
    }
  };

  const handleStakeAmountChange = (value) => {
    setStakeAmount(value);
    if (onStakeAmountChange) {
      onStakeAmountChange(value);
    }
  };

  if (!isConnected) {
    return (
      <Alert className="border-blue-500/20 bg-blue-500/10">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertTitle className="text-blue-400">Connect to Flare Network</AlertTitle>
        <AlertDescription className="text-blue-200">
          <p className="mb-2">You need to be connected to Flare Coston2 Testnet to use FTSO prices and FXRP staking.</p>
          <Button 
            onClick={handleSwitchNetwork} 
            disabled={isSwitching}
            className="mt-2"
            size="sm"
          >
            {isSwitching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Switching...
              </>
            ) : (
              'Switch to Flare Coston2'
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* FTSO Price Section */}
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <h3 className="font-medium text-purple-300">Flare FTSO Price</h3>
          </div>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            Powered by Flare
          </Badge>
        </div>
        
        {assetSymbol ? (
          <div className="mt-2">
            {priceLoading ? (
              <div className="flex items-center gap-2 text-purple-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Fetching price from FTSO...</span>
              </div>
            ) : ftsoPrice ? (
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">
                  ${ftsoPrice.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-purple-300">
                  {assetSymbol}/USD • Source: Flare FTSO (Coston2)
                </p>
                <p className="text-xs text-purple-400">
                  Timestamp: {new Date(ftsoPrice.timestamp).toLocaleString()}
                </p>
              </div>
            ) : (
              <Button 
                onClick={fetchFTSOPrice} 
                size="sm" 
                variant="outline"
                className="border-purple-500/30 text-purple-300"
              >
                Fetch FTSO Price
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-purple-300">Select an asset to see FTSO price</p>
        )}
      </div>

      {/* FXRP Staking Section */}
      <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-orange-400" />
            <h3 className="font-medium text-orange-300">FXRP Staking (FAsset)</h3>
          </div>
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
            FAsset
          </Badge>
        </div>

        <div className="space-y-3 mt-3">
          {/* FXRP Balance */}
          {fxrpBalance !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-orange-300">Your FXRP Balance:</span>
              <span className="font-medium text-white">{fxrpBalance} FXRP</span>
            </div>
          )}

          {/* Stake Amount Input */}
          <div>
            <label className="block text-sm font-medium text-orange-300 mb-1">
              Stake Amount (FXRP)
            </label>
            <Input
              type="number"
              min="1"
              step="0.1"
              value={stakeAmount}
              onChange={(e) => handleStakeAmountChange(e.target.value)}
              disabled={disabled}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="1.0"
            />
            <p className="text-xs text-orange-400 mt-1">
              Minimum: 1 FXRP • Staked FXRP shows skin-in-the-game
            </p>
          </div>

          {/* Approval Status */}
          {fxrpAllowance !== null && parseFloat(fxrpAllowance) < parseFloat(stakeAmount || '0') && (
            <div className="space-y-2">
              <Alert className="border-yellow-500/20 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200 text-sm">
                  Approve FXRP spending to enable staking
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleApproveFXRP}
                disabled={isApproving || disabled}
                className="w-full bg-orange-600 hover:bg-orange-500"
                size="sm"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve FXRP
                  </>
                )}
              </Button>
            </div>
          )}

          {fxrpAllowance !== null && parseFloat(fxrpAllowance) >= parseFloat(stakeAmount || '0') && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200 text-sm">
                FXRP approved. Ready to stake {stakeAmount} FXRP.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

