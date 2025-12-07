// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PredictionDAO is Ownable, ReentrancyGuard {
    struct Prediction {
        uint256 id;
        address creator;
        string title;
        string description;
        string category;
        uint256 endTime;
        bool isActive;
        bool isApproved;
        uint256 totalVotes;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 createdAt;
    }

    struct Vote {
        address voter;
        bool support;
        uint256 timestamp;
    }

    uint256 public nextPredictionId = 1;
    uint256 public constant VOTING_THRESHOLD = 70;
    uint256 public constant MIN_VOTING_PERIOD = 1 days;
    uint256 public constant MAX_VOTING_PERIOD = 7 days;
    
    mapping(uint256 => Prediction) public predictions;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => Vote[]) public votes;
    mapping(address => bool) public isMember;
    
    event PredictionCreated(uint256 indexed predictionId, address indexed creator, string title);
    event VoteCast(uint256 indexed predictionId, address indexed voter, bool support);
    event PredictionApproved(uint256 indexed predictionId, uint256 yesVotes, uint256 totalVotes);
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);

    modifier onlyMember() {
        require(isMember[msg.sender] || msg.sender == owner(), "Not a DAO member");
        _;
    }

    modifier validPrediction(uint256 _predictionId) {
        require(_predictionId > 0 && _predictionId < nextPredictionId, "Invalid prediction ID");
        _;
    }

    constructor() Ownable(msg.sender) {
        isMember[msg.sender] = true;
    }

    function addMember(address _member) external onlyOwner {
        require(_member != address(0), "Invalid address");
        require(!isMember[_member], "Already a member");
        
        isMember[_member] = true;
        emit MemberAdded(_member);
    }

    function removeMember(address _member) external onlyOwner {
        require(_member != address(0), "Invalid address");
        require(isMember[_member], "Not a member");
        require(_member != owner(), "Cannot remove owner");
        
        isMember[_member] = false;
        emit MemberRemoved(_member);
    }

    function createPrediction(
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _votingPeriod
    ) external onlyMember nonReentrant returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_votingPeriod >= MIN_VOTING_PERIOD && _votingPeriod <= MAX_VOTING_PERIOD, "Invalid voting period");

        uint256 predictionId = nextPredictionId;
        nextPredictionId = nextPredictionId + 1;
        uint256 endTime = block.timestamp + _votingPeriod;

        predictions[predictionId] = Prediction({
            id: predictionId,
            creator: msg.sender,
            title: _title,
            description: _description,
            category: _category,
            endTime: endTime,
            isActive: true,
            isApproved: false,
            totalVotes: 0,
            yesVotes: 0,
            noVotes: 0,
            createdAt: block.timestamp
        });

        emit PredictionCreated(predictionId, msg.sender, _title);
        return predictionId;
    }

    function vote(uint256 _predictionId, bool _support) external onlyMember validPrediction(_predictionId) nonReentrant {
        Prediction storage prediction = predictions[_predictionId];
        
        require(prediction.isActive, "Prediction is not active");
        require(block.timestamp <= prediction.endTime, "Voting period has ended");
        require(!hasVoted[_predictionId][msg.sender], "Already voted");

        hasVoted[_predictionId][msg.sender] = true;
        prediction.totalVotes = prediction.totalVotes + 1;
        
        if (_support) {
            prediction.yesVotes = prediction.yesVotes + 1;
        } else {
            prediction.noVotes = prediction.noVotes + 1;
        }

        votes[_predictionId].push(Vote({
            voter: msg.sender,
            support: _support,
            timestamp: block.timestamp
        }));

        emit VoteCast(_predictionId, msg.sender, _support);

        _checkApproval(_predictionId);
    }

    function _checkApproval(uint256 _predictionId) internal {
        Prediction storage prediction = predictions[_predictionId];
        
        if (prediction.totalVotes > 0) {
            uint256 approvalPercentage = (prediction.yesVotes * 100) / prediction.totalVotes;
            
            if (approvalPercentage >= VOTING_THRESHOLD) {
                prediction.isApproved = true;
                prediction.isActive = false;
                emit PredictionApproved(_predictionId, prediction.yesVotes, prediction.totalVotes);
            }
        }
    }

    function finalizePrediction(uint256 _predictionId) external validPrediction(_predictionId) {
        Prediction storage prediction = predictions[_predictionId];
        
        require(prediction.isActive, "Prediction is not active");
        require(block.timestamp > prediction.endTime, "Voting period not ended");
        
        prediction.isActive = false;
        _checkApproval(_predictionId);
    }

    function getPrediction(uint256 _predictionId) external view validPrediction(_predictionId) returns (Prediction memory) {
        return predictions[_predictionId];
    }

    function getPredictionVotes(uint256 _predictionId) external view validPrediction(_predictionId) returns (Vote[] memory) {
        return votes[_predictionId];
    }

    function getApprovedPredictions() external view returns (Prediction[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextPredictionId; i++) {
            if (predictions[i].isApproved) {
                count = count + 1;
            }
        }
        
        Prediction[] memory approvedPredictions = new Prediction[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextPredictionId; i++) {
            if (predictions[i].isApproved) {
                approvedPredictions[index] = predictions[i];
                index = index + 1;
            }
        }
        
        return approvedPredictions;
    }

    function getActivePredictions() external view returns (Prediction[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextPredictionId; i++) {
            if (predictions[i].isActive && block.timestamp <= predictions[i].endTime) {
                count = count + 1;
            }
        }
        
        Prediction[] memory activePredictions = new Prediction[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextPredictionId; i++) {
            if (predictions[i].isActive && block.timestamp <= predictions[i].endTime) {
                activePredictions[index] = predictions[i];
                index = index + 1;
            }
        }
        
        return activePredictions;
    }

    function getPredictionCount() external view returns (uint256) {
        return nextPredictionId - 1;
    }

    function hasUserVoted(uint256 _predictionId, address _user) external view validPrediction(_predictionId) returns (bool) {
        return hasVoted[_predictionId][_user];
    }

    function getVotingStats(uint256 _predictionId) external view validPrediction(_predictionId) returns (uint256 yesVotes, uint256 noVotes, uint256 totalVotes, uint256 approvalPercentage) {
        Prediction memory prediction = predictions[_predictionId];
        yesVotes = prediction.yesVotes;
        noVotes = prediction.noVotes;
        totalVotes = prediction.totalVotes;
        
        if (totalVotes > 0) {
            approvalPercentage = (yesVotes * 100) / totalVotes;
        } else {
            approvalPercentage = 0;
        }
    }
}