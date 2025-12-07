import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Plus, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { predictionDAOAbi } from '../../contract/daoAbi';
import { DAO_CONTRACT_CONFIG } from '../../contract/daoContractAddress';
import FLARE_CONFIG, { switchToFlareNetwork, isConnectedToFlare } from '../../lib/flareConfig';
import flareDaoAbi from '../../lib/abi/flareDaoAbi.json';
import FlareIntegration from '../flare/FlareIntegration';

const CreatePredictionForm = ({ userAddress, onPredictionCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    votingPeriod: '3', // Default to 3 days
    assetSymbol: '', // For Flare contract
    useFlare: true // Use Flare contract by default
  });
  const [isCreating, setIsCreating] = useState(false);
  const [flarePriceData, setFlarePriceData] = useState(null);
  const [flareStakeAmount, setFlareStakeAmount] = useState('1');

  const categories = [
    'Technology',
    'Finance',
    'Crypto',
    'Stock Market',
    'Real Estate',
    'Startups',
    'Economy',
    'Politics',
    'Sports',
    'Entertainment',
    'Other'
  ];

  const votingPeriods = [
    { value: '1', label: '1 Day' },
    { value: '2', label: '2 Days' },
    { value: '3', label: '3 Days' },
    { value: '5', label: '5 Days' },
    { value: '7', label: '7 Days' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a prediction title');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a prediction description');
      return false;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return false;
    }
    if (formData.title.length > 100) {
      toast.error('Title must be less than 100 characters');
      return false;
    }
    if (formData.description.length > 500) {
      toast.error('Description must be less than 500 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userAddress) {
      toast.error('Please connect your wallet to create a prediction');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    try {
      if (formData.useFlare && formData.assetSymbol) {
        // Use Flare contract
        await createFlarePrediction();
      } else {
        // Use regular DAO contract
        await createRegularPrediction();
      }
    } catch (error) {
      console.error('Error creating prediction:', error);
      toast.error('Failed to create prediction. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const createFlarePrediction = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected');
      }

      // Check if connected to Flare network
      const isConnected = await isConnectedToFlare();
      if (!isConnected) {
        await switchToFlareNetwork();
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create contract instance
      const contractAddress = FLARE_CONFIG.predictionContractAddress || '0xd4f877b49584ba9777DBEE27e450bD524193B2f0';
      const contract = new ethers.Contract(
        contractAddress,
        flareDaoAbi,
        signer
      );

      // Prepare prediction data
      const votingPeriodSeconds = parseInt(formData.votingPeriod) * 24 * 60 * 60;
      const stakedAmount = ethers.parseUnits(flareStakeAmount || '1', 18);

      toast.loading('Submitting to Flare contract...', { id: 'flare-tx' });

      // Call createPrediction on Flare contract
      const tx = await contract.createPrediction(
        formData.title,
        formData.description,
        formData.category,
        formData.assetSymbol.toUpperCase(),
        votingPeriodSeconds,
        stakedAmount
      );

      const receipt = await tx.wait();

      // Extract prediction ID from events
      let flarePredictionId = null;
      const predictionCreatedEvent = receipt.logs.find(
        log => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed && parsed.name === 'PredictionCreated';
          } catch {
            return false;
          }
        }
      );

      if (predictionCreatedEvent) {
        const parsed = contract.interface.parseLog(predictionCreatedEvent);
        flarePredictionId = parsed.args.predictionId.toString();
      }

      toast.success('✅ Prediction created on Flare!', { id: 'flare-tx' });

      // Store in backend via Next.js API route
      const response = await fetch('/api/dao/predictions/create-with-flare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          assetSymbol: formData.assetSymbol,
          votingPeriod: formData.votingPeriod,
          creator: userAddress,
          transactionHash: tx.hash,
          flarePredictionId: flarePredictionId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Prediction saved to database!');
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: '',
          votingPeriod: '3',
          assetSymbol: '',
          useFlare: true
        });
        
        if (onPredictionCreated) {
          onPredictionCreated(data.data.id);
        }
      } else {
        throw new Error(data.message || 'Failed to save prediction');
      }
    } catch (error) {
      console.error('Error creating Flare prediction:', error);
      toast.error('Failed to create Flare prediction: ' + error.message, { id: 'flare-tx' });
      throw error;
    }
  };

  const createRegularPrediction = async () => {
    const response = await fetch('/api/dao/predictions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        votingPeriod: formData.votingPeriod,
        creator: userAddress
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      toast.success(data.data.message);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        votingPeriod: '3',
        assetSymbol: '',
        useFlare: true
      });
      
      if (onPredictionCreated) {
        onPredictionCreated(data.data.id);
      }
    } else {
      throw new Error(data.message || 'Failed to create prediction');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Prediction
        </CardTitle>
        <CardDescription>
          Submit a prediction for the DAO community to vote on. Predictions need 70% approval to be featured.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Prediction Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter a clear, concise prediction title"
              maxLength={100}
              required
            />
            <div className="text-xs text-gray-500">
              {formData.title.length}/100 characters
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Provide detailed reasoning and context for your prediction"
              maxLength={500}
              rows={4}
              required
            />
            <div className="text-xs text-gray-500">
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voting Period */}
          <div className="space-y-2">
            <Label htmlFor="votingPeriod">Voting Period *</Label>
            <Select value={formData.votingPeriod} onValueChange={(value) => handleInputChange('votingPeriod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select voting period" />
              </SelectTrigger>
              <SelectContent>
                {votingPeriods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {period.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flare Integration - Asset Symbol */}
          {formData.useFlare && (
            <>
              <div className="space-y-2">
                <Label htmlFor="assetSymbol">Asset Symbol (for Flare FTSO) *</Label>
                <Input
                  id="assetSymbol"
                  value={formData.assetSymbol}
                  onChange={(e) => handleInputChange('assetSymbol', e.target.value.toUpperCase())}
                  placeholder="e.g., BTC, ETH, XRP"
                  maxLength={10}
                  required={formData.useFlare}
                />
                <div className="text-xs text-gray-500">
                  Asset symbol for Flare FTSO oracle price feed
                </div>
              </div>

              {/* Flare Integration Component */}
              {formData.assetSymbol && (
                <FlareIntegration
                  assetSymbol={formData.assetSymbol}
                  onPriceFetched={(price, decimals, timestamp) => {
                    setFlarePriceData({ price, decimals, timestamp });
                  }}
                  onStakeAmountChange={(amount) => {
                    setFlareStakeAmount(amount);
                  }}
                  stakeAmount={flareStakeAmount}
                />
              )}
            </>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Predictions need 70% community approval to be featured</li>
                  <li>• Voting period cannot be changed after creation</li>
                  <li>• You must be a DAO member to create predictions</li>
                  <li>• All predictions are publicly visible and voteable</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isCreating || !userAddress}
            className="w-full"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Prediction...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Prediction
              </>
            )}
          </Button>

          {!userAddress && (
            <div className="text-center">
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Please connect your wallet to create predictions
              </Badge>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePredictionForm;
