import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RefreshCw, TrendingUp, Clock, CheckCircle, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DAOVotingCard from './DAOVotingCard';

const DAOPredictionsList = ({ userAddress }) => {
  const [activePredictions, setActivePredictions] = useState([]);
  const [approvedPredictions, setApprovedPredictions] = useState([]);
  const [flarePredictions, setFlarePredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const [activeResponse, approvedResponse, flareResponse] = await Promise.all([
        fetch('/api/dao/predictions/active'),
        fetch('/api/dao/predictions/approved'),
        fetch('/api/dao/predictions/all-with-flare').catch(() => null)
      ]);

      const activeData = await activeResponse.json();
      const approvedData = await approvedResponse.json();

      if (activeData.success) {
        setActivePredictions(activeData.data);
      }

      if (approvedData.success) {
        setApprovedPredictions(approvedData.data);
      }

      // Fetch Flare predictions
      if (flareResponse && flareResponse.ok) {
        const flareData = await flareResponse.json();
        if (flareData.success) {
          setFlarePredictions(flareData.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPredictions();
    setRefreshing(false);
    toast.success('Predictions refreshed!');
  };

  const handleVoteSuccess = () => {
    fetchPredictions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DAO Community Predictions</h1>
          <p className="text-gray-600 mt-2">
            Vote on predictions and discover community-approved insights
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Active ({activePredictions.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved ({approvedPredictions.length})
          </TabsTrigger>
          <TabsTrigger value="flare" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Flare ({flarePredictions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="space-y-6">
            {activePredictions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Active Predictions
                  </h3>
                  <p className="text-gray-600">
                    There are currently no active predictions for voting.
                  </p>
                </CardContent>
              </Card>
            ) : (
              activePredictions.map((prediction) => (
                <DAOVotingCard
                  key={prediction.id}
                  prediction={prediction}
                  userAddress={userAddress}
                  onVoteSuccess={handleVoteSuccess}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="space-y-6">
            {approvedPredictions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Approved Predictions
                  </h3>
                  <p className="text-gray-600">
                    No predictions have reached the 70% approval threshold yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              approvedPredictions.map((prediction) => (
                <Card key={prediction.id} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold mb-2 text-green-800">
                          {prediction.title}
                        </CardTitle>
                        <CardDescription className="text-green-700">
                          {prediction.description}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-green-600">
                      <div className="flex items-center gap-1">
                        <span>Category: {prediction.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>
                          {Math.round((parseInt(prediction.yesVotes) / parseInt(prediction.totalVotes)) * 100)}% approval
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700">Voting Results:</span>
                        <span className="font-semibold text-green-800">
                          {prediction.yesVotes} Yes • {prediction.noVotes} No • {prediction.totalVotes} Total
                        </span>
                      </div>
                      
                      <div className="text-xs text-green-600 pt-2 border-t border-green-200">
                        Approved by community on {new Date(parseInt(prediction.createdAt) * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="flare" className="mt-6">
          <div className="space-y-6">
            {flarePredictions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Flare Predictions
                  </h3>
                  <p className="text-gray-600">
                    No predictions have been created on the Flare contract yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              flarePredictions.map((prediction) => (
                <Card key={prediction.id} className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold mb-2 flex items-center gap-2">
                          {prediction.title}
                          <Badge className="bg-purple-600 text-white">
                            <Zap className="w-3 h-3 mr-1" />
                            Flare
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-gray-700 dark:text-gray-300">
                          {prediction.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <div className="flex items-center gap-1">
                        <span>Category: {prediction.category}</span>
                      </div>
                      {prediction.assetSymbol && (
                        <div className="flex items-center gap-1">
                          <span>Asset: {prediction.assetSymbol}</span>
                        </div>
                      )}
                      {prediction.priceSourceIsFTSO && prediction.refPriceAtSubmission && (
                        <div className="flex items-center gap-1 text-purple-600">
                          <Zap className="w-4 h-4" />
                          <span>FTSO Price: ${(parseInt(prediction.refPriceAtSubmission) / Math.pow(10, prediction.priceDecimals || 8)).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Voting Results:</span>
                        <span className="font-semibold">
                          {prediction.yesVotes} Yes • {prediction.noVotes} No • {prediction.totalVotes} Total
                        </span>
                      </div>
                      
                      {prediction.stakedAmount && parseInt(prediction.stakedAmount) > 0 && (
                        <div className="text-sm text-purple-600">
                          Staked: {(parseInt(prediction.stakedAmount) / 1e18).toFixed(4)} FXRP
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                        Created on Flare Coston Testnet • {new Date(parseInt(prediction.createdAt) * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DAOPredictionsList;
