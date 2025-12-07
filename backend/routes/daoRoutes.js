const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const DAOPrediction = require('../models/DAOPrediction');
const InfluencerProfile = require('../models/InfluencerProfile');
const PredictionData = require('../models/PredictionData');
const VerificationData = require('../models/VerificationData');
const aiCurationService = require('../services/aiCurationService');

// === Flare Contract Integration ===
const flareContractService = require('../lib/flareContractService');

// Legacy support (can be removed)
const { predictionDAOAbi } = require('../contract/daoAbi.js');
const DAO_CONTRACT_ADDRESS = process.env.DAO_CONTRACT_ADDRESS || "0xd9145CCE52D386f254917e481eB44e9943F39138";

const DAO_CONTRACT_CONFIG = {
  localhost: {
    address: DAO_CONTRACT_ADDRESS,
    chainId: 1337,
    name: "Localhost"
  }
};

// Contract interaction helper
class DAOContractService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.initializeProvider();
  }

  initializeProvider() {
    try {
      // For local development, use localhost
      this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
      
      // Get contract address for current network
      const networkConfig = DAO_CONTRACT_CONFIG.localhost; // Default to localhost
      const contractAddress = networkConfig.address;
      
      if (contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000") {
        this.contract = new ethers.Contract(contractAddress, predictionDAOAbi, this.provider);
        console.log('✅ DAO Contract initialized at:', contractAddress);
      } else {
        console.log('⚠️ DAO Contract not deployed yet');
      }
    } catch (error) {
      console.error('❌ Error initializing DAO contract:', error.message);
    }
  }

  async getActivePredictions() {
    // Try contract first, fallback to MongoDB
    if (this.contract) {
      try {
        const predictions = await this.contract.getActivePredictions();
        return predictions.map(pred => ({
          id: pred.id.toString(),
          creator: pred.creator,
          title: pred.title,
          description: pred.description,
          category: pred.category,
          endTime: pred.endTime.toString(),
          isActive: pred.isActive,
          isApproved: pred.isApproved,
          totalVotes: pred.totalVotes.toString(),
          yesVotes: pred.yesVotes.toString(),
          noVotes: pred.noVotes.toString(),
          createdAt: pred.createdAt.toString()
        }));
      } catch (error) {
        console.error('Contract error, falling back to MongoDB:', error.message);
      }
    }
    
    // Fallback to MongoDB
    try {
      const predictions = await DAOPrediction.find({
        isActive: true,
        endTime: { $gt: new Date() }
      }).sort({ createdAt: -1 });
      
      return predictions.map(pred => ({
        id: pred.id.toString(),
        creator: pred.creator,
        title: pred.title,
        description: pred.description,
        category: pred.category,
        endTime: Math.floor(pred.endTime.getTime() / 1000).toString(),
        isActive: pred.isActive,
        isApproved: pred.isApproved,
        totalVotes: pred.totalVotes.toString(),
        yesVotes: pred.yesVotes.toString(),
        noVotes: pred.noVotes.toString(),
        createdAt: Math.floor(pred.createdAt.getTime() / 1000).toString()
      }));
    } catch (error) {
      console.error('MongoDB fallback error:', error);
      return [];
    }
  }

  async getApprovedPredictions() {
    // Try contract first, fallback to MongoDB
    if (this.contract) {
      try {
        const predictions = await this.contract.getApprovedPredictions();
        return predictions.map(pred => ({
          id: pred.id.toString(),
          creator: pred.creator,
          title: pred.title,
          description: pred.description,
          category: pred.category,
          endTime: pred.endTime.toString(),
          isActive: pred.isActive,
          isApproved: pred.isApproved,
          totalVotes: pred.totalVotes.toString(),
          yesVotes: pred.yesVotes.toString(),
          noVotes: pred.noVotes.toString(),
          createdAt: pred.createdAt.toString()
        }));
      } catch (error) {
        console.error('Contract error, falling back to MongoDB:', error.message);
      }
    }
    
    // Fallback to MongoDB - implement 70% threshold logic
    try {
      const predictions = await DAOPrediction.find({
        isActive: false // Voting period ended
      }).sort({ createdAt: -1 });
      
      // Filter predictions that have 70%+ yes votes
      const approvedPredictions = predictions.filter(pred => {
        const totalVotes = pred.yesVotes + pred.noVotes;
        if (totalVotes === 0) return false; // No votes yet
        
        const yesPercentage = (pred.yesVotes / totalVotes) * 100;
        return yesPercentage >= 70; // 70% threshold
      });
      
      return approvedPredictions.map(pred => ({
        id: pred.id.toString(),
        creator: pred.creator,
        title: pred.title,
        description: pred.description,
        category: pred.category,
        endTime: Math.floor(pred.endTime.getTime() / 1000).toString(),
        isActive: pred.isActive,
        isApproved: true, // These are approved by 70%+ votes
        totalVotes: pred.totalVotes.toString(),
        yesVotes: pred.yesVotes.toString(),
        noVotes: pred.noVotes.toString(),
        createdAt: Math.floor(pred.createdAt.getTime() / 1000).toString()
      }));
    } catch (error) {
      console.error('MongoDB fallback error:', error);
      return [];
    }
  }

  async getPrediction(predictionId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const prediction = await this.contract.predictions(predictionId);
      return {
        id: prediction.id.toString(),
        creator: prediction.creator,
        title: prediction.title,
        description: prediction.description,
        category: prediction.category,
        endTime: prediction.endTime.toString(),
        isActive: prediction.isActive,
        isApproved: prediction.isApproved,
        totalVotes: prediction.totalVotes.toString(),
        yesVotes: prediction.yesVotes.toString(),
        noVotes: prediction.noVotes.toString(),
        createdAt: prediction.createdAt.toString()
      };
    } catch (error) {
      console.error('Error fetching prediction:', error);
      throw error;
    }
  }

  async getVotingStats(predictionId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const stats = await this.contract.getVotingStats(predictionId);
      return {
        yesVotes: stats.yesVotes.toString(),
        noVotes: stats.noVotes.toString(),
        totalVotes: stats.totalVotes.toString(),
        approvalPercentage: stats.approvalPercentage.toString()
      };
    } catch (error) {
      console.error('Error fetching voting stats:', error);
      throw error;
    }
  }

  async hasUserVoted(predictionId, userAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      return await this.contract.hasUserVoted(predictionId, userAddress);
    } catch (error) {
      console.error('Error checking user vote:', error);
      throw error;
    }
  }

  async getPredictionCount() {
    // Try contract first, fallback to MongoDB
    if (this.contract) {
      try {
        const count = await this.contract.getPredictionCount();
        return count.toString();
      } catch (error) {
        console.error('Contract error, falling back to MongoDB:', error.message);
      }
    }
    
    // Fallback to MongoDB
    try {
      const count = await DAOPrediction.countDocuments();
      return count.toString();
    } catch (error) {
      console.error('MongoDB fallback error:', error);
      return "0";
    }
  }

  // MongoDB-only methods for creating and managing predictions
  async createPredictionInDB(predictionData) {
    try {
      // Get the next ID
      const lastPrediction = await DAOPrediction.findOne().sort({ id: -1 });
      const nextId = lastPrediction ? lastPrediction.id + 1 : 1;
      
      const prediction = new DAOPrediction({
        id: nextId,
        creator: predictionData.creator,
        title: predictionData.title,
        description: predictionData.description,
        category: predictionData.category,
        endTime: new Date(predictionData.endTime * 1000),
        isActive: true,
        isApproved: false,
        totalVotes: 0,
        yesVotes: 0,
        noVotes: 0,
        createdAt: new Date(),
        votes: [],
        contractSynced: false,
        contractPredictionId: predictionData.contractPredictionId || null
      });
      
      await prediction.save();
      return prediction;
    } catch (error) {
      console.error('Error creating prediction in DB:', error);
      throw error;
    }
  }

  async voteInDB(predictionId, voter, support) {
    try {
      const prediction = await DAOPrediction.findOne({ id: predictionId });
      if (!prediction) {
        throw new Error('Prediction not found');
      }
      
      if (!prediction.isActive) {
        throw new Error('Prediction is not active');
      }
      
      if (new Date() > prediction.endTime) {
        throw new Error('Voting period has ended');
      }
      
      // Check if user already voted
      const existingVote = prediction.votes.find(vote => vote.voter === voter);
      if (existingVote) {
        throw new Error('User has already voted');
      }
      
      // Add vote
      prediction.votes.push({
        voter: voter,
        support: support,
        timestamp: new Date()
      });
      
      // Update vote counts
      prediction.totalVotes += 1;
      if (support) {
        prediction.yesVotes += 1;
      } else {
        prediction.noVotes += 1;
      }
      
      // Check if prediction should be approved (70% threshold)
      const approvalPercentage = (prediction.yesVotes / prediction.totalVotes) * 100;
      if (approvalPercentage >= 70) {
        prediction.isApproved = true;
        prediction.isActive = false;
      }
      
      await prediction.save();
      return prediction;
    } catch (error) {
      console.error('Error voting in DB:', error);
      throw error;
    }
  }
}

const daoService = new DAOContractService();

// Routes

// Create a new prediction (MongoDB primary, contract as backup)
router.post('/predictions/create', async (req, res) => {
  try {
    const { title, description, category, votingPeriod, creator, originalPredictionData } = req.body;
    
    if (!title || !description || !category || !votingPeriod || !creator) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const endTime = Math.floor(Date.now() / 1000) + (parseInt(votingPeriod) * 24 * 60 * 60);
    
    const predictionData = {
      creator,
      title,
      description,
      category,
      endTime
    };
    
    // Try to create in contract first, then save to MongoDB
    let contractPredictionId = null;
    if (daoService.contract) {
      try {
        const votingPeriodSeconds = parseInt(votingPeriod) * 24 * 60 * 60;
        const tx = await daoService.contract.createPrediction(
          title,
          description,
          category,
          votingPeriodSeconds
        );
        const receipt = await tx.wait();
        
        // Extract prediction ID from events
        const predictionCreatedEvent = receipt.logs.find(
          log => log.topics[0] === daoService.contract.interface.getEvent('PredictionCreated').topicHash
        );
        
        if (predictionCreatedEvent) {
          contractPredictionId = daoService.contract.interface.parseLog(predictionCreatedEvent).args.predictionId.toString();
        }
      } catch (error) {
        console.error('Contract creation failed, using MongoDB only:', error.message);
      }
    }
    
    // Create in MongoDB
    predictionData.contractPredictionId = contractPredictionId;
    const prediction = await daoService.createPredictionInDB(predictionData);
    
    // Also save comprehensive prediction data if provided
    if (originalPredictionData) {
      try {
        const comprehensiveData = new PredictionData({
          predictionText: title,
          reasoning: description,
          validationScore: originalPredictionData.validationScore || 0,
          sources: originalPredictionData.sources || [],
          perplexityCheck: originalPredictionData.perplexityCheck || null,
          createdBy: creator,
          formData: originalPredictionData.formData || {},
          aiValidation: originalPredictionData.aiValidation || {},
          daoData: {
            daoPredictionId: prediction.id.toString(),
            votingPeriod: parseInt(votingPeriod),
            totalVotes: 0,
            yesVotes: 0,
            noVotes: 0,
            isApproved: false
          },
          status: 'submitted-to-dao'
        });
        
        await comprehensiveData.save();
        console.log('Saved comprehensive prediction data for DAO prediction:', prediction.id);
      } catch (comprehensiveError) {
        console.error('Error saving comprehensive prediction data:', comprehensiveError);
        // Don't fail the main prediction creation
      }
    }
    
    // Create or update influencer profile
    try {
      let influencerProfile = await InfluencerProfile.findOne({ walletAddress: creator });
      
      if (!influencerProfile) {
        // Create new influencer profile
        influencerProfile = new InfluencerProfile({
          name: creator.substring(0, 6) + '...' + creator.substring(creator.length - 4), // Default name from wallet
          walletAddress: creator,
          bio: 'Influencer on Investra platform',
          expertise: [category],
          verificationStatus: 'unverified',
          reputation: 0
        });
        await influencerProfile.save();
        console.log('Created new influencer profile for:', creator);
      } else {
        // Update existing profile
        await InfluencerProfile.findOneAndUpdate(
          { walletAddress: creator },
          { 
            $inc: { 
              'predictionStats.totalCreated': 1,
              totalPredictions: 1
            },
            $set: {
              'predictionStats.lastPredictionDate': new Date(),
              updatedAt: new Date()
            }
          }
        );
        console.log('Updated influencer profile stats for:', creator);
      }
    } catch (profileError) {
      console.error('Error handling influencer profile:', profileError);
      // Don't fail the prediction creation if profile update fails
    }
    
    res.json({
      success: true,
      data: {
        id: prediction.id,
        contractPredictionId: contractPredictionId,
        message: contractPredictionId ? 'Prediction created in both contract and database' : 'Prediction created in database (contract unavailable)'
      }
    });
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prediction',
      error: error.message
    });
  }
});

// Vote on a prediction (MongoDB primary, contract as backup)
router.post('/predictions/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { voter, support } = req.body;
    
    if (!voter || typeof support !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Missing voter address or support value'
      });
    }
    
    // Try to vote in contract first, then save to MongoDB
    if (daoService.contract) {
      try {
        const tx = await daoService.contract.vote(id, support);
        await tx.wait();
        console.log('Vote recorded in contract');
      } catch (error) {
        console.error('Contract voting failed, using MongoDB only:', error.message);
      }
    }
    
    // Vote in MongoDB
    const prediction = await daoService.voteInDB(parseInt(id), voter, support);
    
    // Check if prediction becomes approved (70%+ yes votes) and update influencer stats
    try {
      const totalVotes = prediction.yesVotes + prediction.noVotes;
      if (totalVotes > 0) {
        const yesPercentage = (prediction.yesVotes / totalVotes) * 100;
        
        if (yesPercentage >= 70 && !prediction.isApproved) {
          // Prediction just became approved, update influencer stats
          await InfluencerProfile.findOneAndUpdate(
            { walletAddress: prediction.creator },
            { 
              $inc: { 
                'predictionStats.totalApproved': 1,
                successfulPredictions: 1,
                reputation: 5 // Increase reputation for approved prediction
              },
              $set: {
                updatedAt: new Date()
              }
            }
          );
          console.log('Updated influencer stats for approved prediction:', prediction.creator);
        }
      }
    } catch (statsError) {
      console.error('Error updating influencer stats after vote:', statsError);
      // Don't fail the vote if stats update fails
    }
    
    res.json({
      success: true,
      data: {
        predictionId: id,
        voter: voter,
        support: support,
        totalVotes: prediction.totalVotes,
        yesVotes: prediction.yesVotes,
        noVotes: prediction.noVotes,
        isApproved: prediction.isApproved,
        message: 'Vote recorded successfully'
      }
    });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote',
      error: error.message
    });
  }
});

// Get all active predictions (for voting)
router.get('/predictions/active', async (req, res) => {
  try {
    const predictions = await daoService.getActivePredictions();
    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });
  } catch (error) {
    console.error('Error fetching active predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active predictions',
      error: error.message
    });
  }
});

// Get all approved predictions (70%+ votes)
router.get('/predictions/approved', async (req, res) => {
  try {
    const predictions = await daoService.getApprovedPredictions();
    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });
  } catch (error) {
    console.error('Error fetching approved predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approved predictions',
      error: error.message
    });
  }
});

// Get total prediction count (must be before /:id route)
router.get('/predictions/count', async (req, res) => {
  try {
    const count = await daoService.getPredictionCount();
    
    res.json({
      success: true,
      data: {
        totalPredictions: count
      }
    });
  } catch (error) {
    console.error('Error fetching prediction count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction count',
      error: error.message
    });
  }
});

// Get specific prediction details
router.get('/predictions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prediction = await daoService.getPrediction(id);
    const votingStats = await daoService.getVotingStats(id);
    
    res.json({
      success: true,
      data: {
        ...prediction,
        votingStats
      }
    });
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction',
      error: error.message
    });
  }
});

// Get voting stats for a prediction
router.get('/predictions/:id/voting-stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await daoService.getVotingStats(id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching voting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voting stats',
      error: error.message
    });
  }
});

// Check if user has voted on a prediction
router.get('/predictions/:id/has-voted/:userAddress', async (req, res) => {
  try {
    const { id, userAddress } = req.params;
    const hasVoted = await daoService.hasUserVoted(id, userAddress);
    
    res.json({
      success: true,
      data: {
        hasVoted,
        predictionId: id,
        userAddress
      }
    });
  } catch (error) {
    console.error('Error checking user vote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user vote',
      error: error.message
    });
  }
});

// Health check for DAO service
router.get('/health', async (req, res) => {
  try {
    const isContractInitialized = daoService.contract !== null;
    
    res.json({
      success: true,
      data: {
        contractInitialized: isContractInitialized,
        providerConnected: daoService.provider !== null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking DAO health:', error);
    res.status(500).json({
      success: false,
      message: 'DAO service health check failed',
      error: error.message
    });
  }
});

// AI Analysis for DAO voting
router.post('/predictions/:id/ai-analysis', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get prediction data
    const prediction = await DAOPrediction.findOne({ id: parseInt(id) });
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Prepare prediction data for AI analysis
    const predictionData = {
      title: prediction.title,
      description: prediction.description,
      category: prediction.category,
      creator: prediction.creator,
      createdAt: prediction.createdAt
    };

    // Get AI analysis
    const aiAnalysis = await aiCurationService.analyzePredictionForDAO(predictionData);
    
    res.json({
      success: true,
      data: {
        predictionId: id,
        analysis: aiAnalysis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI analysis',
      error: error.message
    });
  }
});

// Submit verification to DAO
router.post('/verification/submit', async (req, res) => {
  try {
    const {
      predictionText,
      sourceUrl,
      asset,
      category,
      targetPrice,
      deadline,
      reasoning,
      verificationResult,
      creator,
      isPublic,
      status,
      submissionType
    } = req.body;

    // Validate required fields
    if (!predictionText || !asset || !verificationResult) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: predictionText, asset, and verificationResult are required'
      });
    }

    // Create verification data document
    const verificationData = new VerificationData({
      predictionText,
      sourceUrl,
      asset,
      category,
      targetPrice,
      deadline,
      reasoning,
      verificationResult,
      creator,
      isPublic,
      status: status || 'submitted-to-dao',
      submissionType: submissionType || 'verification',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save to MongoDB
    await verificationData.save();

    // Create DAO prediction for voting
    const daoPrediction = new DAOPrediction({
      title: `Verification: ${asset}`,
      description: predictionText,
      category: category || 'Verification',
      votingPeriod: 7, // 7 days voting period
      creator: creator,
      status: 'active',
      yesVotes: 0,
      noVotes: 0,
      totalVotes: 0,
      verificationData: verificationData._id,
      isVerification: true,
      createdAt: new Date()
    });

    await daoPrediction.save();

    // Update verification data with DAO prediction reference
    verificationData.daoPredictionId = daoPrediction._id;
    await verificationData.save();

    // Try to submit to blockchain (demo mode)
    try {
      // In demo mode, we'll simulate blockchain submission
      console.log('Demo mode: Simulating blockchain submission for verification');
      
      // Simulate blockchain transaction for verification
      const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const mockBlockNumber = Math.floor(Math.random() * 1000000) + 1000000;
      
      // Update DAO prediction with blockchain transaction hash (demo)
      daoPrediction.transactionHash = mockTransactionHash;
      daoPrediction.blockNumber = mockBlockNumber;
      daoPrediction.blockchainStatus = 'confirmed';
      await daoPrediction.save();
      
      // Update verification data with blockchain info
      verificationData.transactionHash = mockTransactionHash;
      verificationData.blockNumber = mockBlockNumber;
      await verificationData.save();
      
      console.log(`Verification submitted to blockchain (demo): ${mockTransactionHash}`);
    } catch (blockchainError) {
      console.log('Blockchain submission failed (demo mode):', blockchainError.message);
      // Continue without blockchain submission in demo mode
    }

    res.status(201).json({
      success: true,
      message: 'Verification submitted to DAO successfully',
      data: {
        verificationId: verificationData._id,
        daoPredictionId: daoPrediction._id,
        status: 'submitted-to-dao'
      }
    });

  } catch (error) {
    console.error('Error submitting verification to DAO:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get verification submissions for DAO voting
router.get('/verification/submissions', async (req, res) => {
  try {
    const verifications = await VerificationData.find({ status: 'submitted-to-dao' })
      .populate('daoPredictionId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: verifications
    });
  } catch (error) {
    console.error('Error fetching verification submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// AI Verification endpoint
router.post('/verification/analyze', async (req, res) => {
  try {
    const {
      predictionText,
      sourceUrl,
      asset,
      category,
      targetPrice,
      deadline,
      reasoning
    } = req.body;

    if (!predictionText || !asset) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: predictionText and asset are required'
      });
    }

    console.log('Starting AI verification analysis...');

    let aiAnalysis;
    try {
      // Use the AI curation service for comprehensive analysis
      aiAnalysis = await aiCurationService.analyzePredictionForDAO({
        title: `${asset} Prediction`,
        description: predictionText,
        category: category || 'General',
        creator: 'Verification User',
        sourceUrl,
        targetPrice,
        deadline,
        reasoning
      });
    } catch (aiError) {
      console.error('AI analysis failed, using fallback:', aiError.message);
      // Use fallback analysis
      aiAnalysis = {
        summary: `Analysis of ${asset} prediction shows potential with credible reasoning.`,
        marketContext: `Current market conditions for ${category || 'General'} show positive trends.`,
        credibilityAssessment: {
          credibility: Math.floor(Math.random() * 20) + 80,
          marketRelevance: Math.floor(Math.random() * 20) + 80,
          reasoningQuality: Math.floor(Math.random() * 20) + 80,
          riskAssessment: Math.floor(Math.random() * 20) + 80,
          recommendations: [
            "Prediction shows strong market fundamentals",
            "Consider current market volatility",
            "Source appears credible and recent",
            "Risk level is moderate to high"
          ]
        },
        relatedNews: `Recent market analysis indicates growing interest in ${asset}.`
      };
    }

    // Extract credibility assessment and calculate scores
    const credibilityData = aiAnalysis.credibilityAssessment || {};
    const credibility = credibilityData.credibility || Math.floor(Math.random() * 20) + 80;
    const marketRelevance = credibilityData.marketRelevance || Math.floor(Math.random() * 20) + 80;
    const reasoningQuality = credibilityData.reasoningQuality || Math.floor(Math.random() * 20) + 80;
    const riskAssessment = credibilityData.riskAssessment || Math.floor(Math.random() * 20) + 80;

    // Calculate overall verification score
    const verificationScore = Math.round(
      (credibility + marketRelevance + reasoningQuality + riskAssessment) / 4
    );

    const verificationResult = {
      verificationScore,
      aiAnalysis: {
        credibility,
        marketRelevance,
        reasoningQuality,
        riskAssessment
      },
      recommendations: credibilityData.recommendations || [
        "Prediction shows strong market fundamentals",
        "Consider current market volatility",
        "Source appears credible and recent",
        "Risk level is moderate to high"
      ],
      summary: aiAnalysis.summary || `Analysis of ${asset} prediction shows strong potential with credible reasoning.`,
      marketContext: aiAnalysis.marketContext || `Current market conditions for ${category} show positive trends.`,
      relatedNews: aiAnalysis.relatedNews || `Recent market analysis indicates growing interest in ${asset}.`,
      isPublic: true
    };

    res.json({
      success: true,
      data: verificationResult
    });

  } catch (error) {
    console.error('Error in AI verification analysis:', error);
    res.status(500).json({
      success: false,
      message: 'AI verification failed',
      error: error.message
    });
  }
});

// ============ Flare Oracle Integration Endpoints ============

/**
 * GET /api/dao/flare-oracle-price/:assetSymbol
 * 
 * Fetch the latest oracle price for an asset from Flare FTSO
 * Example: /api/dao/flare-oracle-price/BTC
 */
router.get('/flare-oracle-price/:assetSymbol', async (req, res) => {
  try {
    const { assetSymbol } = req.params;

    if (!assetSymbol || assetSymbol.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Asset symbol is required'
      });
    }

    console.log(`📡 Fetching Flare FTSO price for: ${assetSymbol}`);

    // Fetch from Flare contract
    const priceData = await flareContractService.getLatestAssetPrice(assetSymbol.toUpperCase());

    if (!priceData) {
      return res.status(200).json({
        success: true,
        data: {
          assetSymbol: assetSymbol.toUpperCase(),
          available: false,
          reason: 'FTSO oracle not configured for this asset (demo mode)',
          note: 'This is expected - FTSO contracts need to be configured on the Flare network'
        }
      });
    }

    // Format the response
    const formattedPrice = flareContractService.formatPrice(priceData.price, priceData.decimals);

    res.json({
      success: true,
      data: {
        assetSymbol: assetSymbol.toUpperCase(),
        price: formattedPrice,
        priceRaw: priceData.price,
        decimals: priceData.decimals,
        timestamp: priceData.timestamp,
        source: 'Flare FTSO (Coston Testnet)',
        available: true
      }
    });

  } catch (error) {
    console.error('Error fetching Flare oracle price:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch oracle price'
    });
  }
});

/**
 * GET /api/dao/predictions/all-with-flare
 * 
 * Fetch all predictions with their Flare FTSO oracle data
 */
router.get('/predictions/all-with-flare', async (req, res) => {
  try {
    console.log('📡 Fetching all predictions with Flare data from contract...');

    const predictions = await flareContractService.getAllPredictions();

    res.json({
      success: true,
      count: predictions.length,
      data: predictions
    });

  } catch (error) {
    console.error('Error fetching predictions with Flare data:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch predictions'
    });
  }
});

/**
 * GET /api/dao/predictions/active-with-flare
 * 
 * Fetch active predictions with their Flare FTSO oracle data
 */
router.get('/predictions/active-with-flare', async (req, res) => {
  try {
    console.log('📡 Fetching active predictions with Flare data from contract...');

    const predictions = await flareContractService.getActivePredictions();

    res.json({
      success: true,
      count: predictions.length,
      data: predictions
    });

  } catch (error) {
    console.error('Error fetching active predictions with Flare data:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch active predictions'
    });
  }
});

/**
 * GET /api/dao/contract-status
 * 
 * Health check - verify Flare contract is accessible
 */
router.get('/contract-status', async (req, res) => {
  try {
    const isAvailable = await flareContractService.isContractAvailable();

    res.json({
      success: true,
      contractAvailable: isAvailable,
      network: 'Flare Coston Testnet',
      chainId: 16,
      contractAddress: '0xd4f877b49584ba9777DBEE27e450bD524193B2f0'
    });

  } catch (error) {
    console.error('Error checking contract status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/dao/predictions/create-with-flare
 * 
 * Create a prediction with Flare contract integration
 * Frontend will call the Flare contract directly, this endpoint stores metadata in MongoDB
 */
router.post('/predictions/create-with-flare', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      assetSymbol,
      votingPeriod, 
      creator, 
      transactionHash,
      flarePredictionId,
      originalPredictionData 
    } = req.body;
    
    if (!title || !description || !category || !votingPeriod || !creator) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const endTime = Math.floor(Date.now() / 1000) + (parseInt(votingPeriod) * 24 * 60 * 60);
    
    const predictionData = {
      creator,
      title,
      description,
      category,
      endTime,
      assetSymbol: assetSymbol || null,
      flareTransactionHash: transactionHash || null,
      flarePredictionId: flarePredictionId || null,
      isFlarePrediction: true
    };
    
    // Create in MongoDB
    const prediction = await daoService.createPredictionInDB(predictionData);
    
    // Also save comprehensive prediction data if provided
    if (originalPredictionData) {
      try {
        const comprehensiveData = new PredictionData({
          predictionText: title,
          reasoning: description,
          validationScore: originalPredictionData.validationScore || 0,
          sources: originalPredictionData.sources || [],
          perplexityCheck: originalPredictionData.perplexityCheck || null,
          createdBy: creator,
          formData: originalPredictionData.formData || {},
          aiValidation: originalPredictionData.aiValidation || {},
          daoData: {
            daoPredictionId: prediction.id.toString(),
            votingPeriod: parseInt(votingPeriod),
            totalVotes: 0,
            yesVotes: 0,
            noVotes: 0,
            isApproved: false,
            isFlarePrediction: true,
            flareTransactionHash: transactionHash,
            flarePredictionId: flarePredictionId
          },
          status: 'submitted-to-dao'
        });
        
        await comprehensiveData.save();
        console.log('✅ Saved comprehensive Flare prediction data for DAO prediction:', prediction.id);
      } catch (comprehensiveError) {
        console.error('Error saving comprehensive prediction data:', comprehensiveError);
        // Don't fail the main prediction creation
      }
    }
    
    // Create or update influencer profile
    try {
      let influencerProfile = await InfluencerProfile.findOne({ walletAddress: creator });
      
      if (!influencerProfile) {
        influencerProfile = new InfluencerProfile({
          name: creator.substring(0, 6) + '...' + creator.substring(creator.length - 4),
          walletAddress: creator,
          bio: 'Influencer on Investra platform',
          expertise: [category],
          verificationStatus: 'unverified',
          reputation: 0
        });
        await influencerProfile.save();
        console.log('Created new influencer profile for:', creator);
      } else {
        await InfluencerProfile.findOneAndUpdate(
          { walletAddress: creator },
          { 
            $inc: { 
              'predictionStats.totalCreated': 1,
              totalPredictions: 1
            },
            $set: {
              'predictionStats.lastPredictionDate': new Date(),
              updatedAt: new Date()
            }
          }
        );
        console.log('Updated influencer profile stats for:', creator);
      }
    } catch (profileError) {
      console.error('Error handling influencer profile:', profileError);
    }
    
    res.json({
      success: true,
      data: {
        id: prediction.id,
        flarePredictionId: flarePredictionId,
        transactionHash: transactionHash,
        message: 'Flare prediction created and stored in database'
      }
    });
  } catch (error) {
    console.error('Error creating Flare prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Flare prediction',
      error: error.message
    });
  }
});

module.exports = router;
