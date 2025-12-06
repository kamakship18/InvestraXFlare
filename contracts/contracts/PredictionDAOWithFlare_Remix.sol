// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// For Remix: Use GitHub imports if @openzeppelin doesn't work
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/security/ReentrancyGuard.sol";

/**
 * @title PredictionDAOWithFlare
 * @notice Enhanced PredictionDAO with Flare FTSO price oracle and FXRP (FAsset) staking
 * @dev Integrates Flare Time Series Oracle (FTSO) v2 for real-time asset prices
 *      and FXRP (FAsset) as staking token for expert predictions
 * 
 * DEPLOYMENT: Use this version for Remix IDE
 */
contract PredictionDAOWithFlare is Ownable, ReentrancyGuard {
    
    // ============ ERC20 Interface for FXRP ============
    interface IERC20 {
        function transferFrom(address from, address to, uint256 value) external returns (bool);
        function transfer(address to, uint256 value) external returns (bool);
        function balanceOf(address account) external view returns (uint256);
        function allowance(address owner, address spender) external view returns (uint256);
    }
    
    // ============ FTSO v2 Interface ============
    // Based on Flare's FTSO v2 interface for Coston2 testnet
    interface IFtsoV2 {
        function getCurrentPrice() external view returns (
            uint256 _price,
            uint256 _timestamp,
            uint256 _assetPriceUsdDecimals
        );
        function getPrice(uint256 _epochId) external view returns (
            uint256 _price,
            uint256 _timestamp,
            uint256 _assetPriceUsdDecimals
        );
    }
    
    // ============ Structs ============
    struct Prediction {
        uint256 id;
        address creator;
        string title;
        string description;
        string category;
        string assetSymbol; // e.g., "BTC", "ETH", "FLR"
        uint256 endTime;
        bool isActive;
        bool isApproved;
        uint256 totalVotes;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 createdAt;
        // Flare FTSO Integration Fields
        uint256 refPriceAtSubmission; // Price from FTSO at submission (normalized to 8 decimals)
        uint256 priceTimestamp; // Timestamp when price was captured
        uint8 priceDecimals; // Decimals from FTSO
        bool priceSourceIsFTSO; // Flag indicating price came from FTSO
        // FXRP Staking Fields
        uint256 stakedAmount; // Amount of FXRP staked (in FXRP's native decimals)
        address stakeTokenAddress; // FXRP token address
    }
    
    struct Vote {
        address voter;
        bool support;
        uint256 timestamp;
    }
    
    // ============ State Variables ============
    uint256 public nextPredictionId = 1;
    uint256 public constant VOTING_THRESHOLD = 70;
    uint256 public constant MIN_VOTING_PERIOD = 1 days;
    uint256 public constant MAX_VOTING_PERIOD = 7 days;
    uint256 public constant MIN_STAKE = 1 * 10**18; // Minimum 1 FXRP (assuming 18 decimals)
    
    // FXRP token address on Flare Coston2 testnet
    // TODO: Replace with actual FXRP testnet address when available
    address public constant FXRP_TOKEN_ADDRESS = address(0x0000000000000000000000000000000000000000); // PLACEHOLDER
    
    // FTSO contract addresses on Coston2 (these are example addresses - update with real ones)
    // For demo, we'll use a mapping from asset symbol to FTSO contract address
    mapping(string => address) public ftsoContracts; // e.g., "BTC" => FTSO contract address
    
    mapping(uint256 => Prediction) public predictions;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => Vote[]) public votes;
    mapping(address => bool) public isMember;
    
    // ============ Events ============
    event PredictionCreated(
        uint256 indexed predictionId,
        address indexed creator,
        string title,
        uint256 refPrice,
        uint256 stakedAmount
    );
    event VoteCast(uint256 indexed predictionId, address indexed voter, bool support);
    event PredictionApproved(uint256 indexed predictionId, uint256 yesVotes, uint256 totalVotes);
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event FTSOContractSet(string indexed assetSymbol, address ftsoAddress);
    event StakeWithdrawn(uint256 indexed predictionId, address indexed creator, uint256 amount);
    
    // ============ Modifiers ============
    modifier onlyMember() {
        require(isMember[msg.sender] || msg.sender == owner(), "Not a DAO member");
        _;
    }
    
    modifier validPrediction(uint256 _predictionId) {
        require(_predictionId > 0 && _predictionId < nextPredictionId, "Invalid prediction ID");
        _;
    }
    
    // ============ Constructor ============
    constructor() {
        isMember[msg.sender] = true;
        
        // Initialize FTSO contract addresses for common assets
        // NOTE: These are placeholder addresses - update with actual FTSO contract addresses on Coston2
        // You can find these in Flare's documentation or by querying the ContractRegistry
        ftsoContracts["BTC"] = address(0x0000000000000000000000000000000000000000); // PLACEHOLDER
        ftsoContracts["ETH"] = address(0x0000000000000000000000000000000000000000); // PLACEHOLDER
        ftsoContracts["FLR"] = address(0x0000000000000000000000000000000000000000); // PLACEHOLDER
        ftsoContracts["XRP"] = address(0x0000000000000000000000000000000000000000); // PLACEHOLDER
    }
    
    // ============ FTSO Integration Functions ============
    
    /**
     * @notice Set FTSO contract address for an asset symbol
     * @param _assetSymbol Asset symbol (e.g., "BTC", "ETH")
     * @param _ftsoAddress FTSO v2 contract address for that asset
     */
    function setFTSOContract(string memory _assetSymbol, address _ftsoAddress) external onlyOwner {
        require(_ftsoAddress != address(0), "Invalid FTSO address");
        ftsoContracts[_assetSymbol] = _ftsoAddress;
        emit FTSOContractSet(_assetSymbol, _ftsoAddress);
    }
    
    /**
     * @notice Get latest asset price from Flare FTSO
     * @param _assetSymbol Asset symbol to query (e.g., "BTC", "ETH")
     * @return price Normalized price (8 decimals)
     * @return decimals Original decimals from FTSO
     * @return timestamp Timestamp when price was captured
     */
    function getLatestAssetPrice(string memory _assetSymbol) 
        public 
        view 
        returns (uint256 price, uint8 decimals, uint256 timestamp) 
    {
        address ftsoAddress = ftsoContracts[_assetSymbol];
        require(ftsoAddress != address(0), "FTSO contract not set for this asset");
        
        IFtsoV2 ftso = IFtsoV2(ftsoAddress);
        (uint256 _price, uint256 _timestamp, uint256 _assetPriceUsdDecimals) = ftso.getCurrentPrice();
        
        // Normalize to 8 decimals for storage
        // FTSO typically returns prices with 5 decimals, we normalize to 8
        uint8 _decimals = uint8(_assetPriceUsdDecimals);
        if (_decimals < 8) {
            price = _price * (10 ** (8 - _decimals));
        } else if (_decimals > 8) {
            price = _price / (10 ** (_decimals - 8));
        } else {
            price = _price;
        }
        
        decimals = _decimals;
        timestamp = _timestamp;
    }
    
    // ============ FXRP Staking Functions ============
    
    /**
     * @notice Get FXRP token balance for an address
     */
    function getFXRPBalance(address _account) external view returns (uint256) {
        IERC20 fxrp = IERC20(FXRP_TOKEN_ADDRESS);
        return fxrp.balanceOf(_account);
    }
    
    /**
     * @notice Check if user has approved enough FXRP for staking
     */
    function checkFXRPAllowance(address _user, uint256 _amount) external view returns (bool) {
        IERC20 fxrp = IERC20(FXRP_TOKEN_ADDRESS);
        return fxrp.allowance(_user, address(this)) >= _amount;
    }
    
    // ============ Enhanced Prediction Creation ============
    
    /**
     * @notice Create a new prediction with FTSO price capture and FXRP staking
     * @param _title Prediction title
     * @param _description Prediction description
     * @param _category Prediction category
     * @param _assetSymbol Asset symbol (e.g., "BTC", "ETH") for FTSO price lookup
     * @param _votingPeriod Voting period in seconds
     * @param _stakeAmount Amount of FXRP to stake (must be >= MIN_STAKE)
     */
    function createPrediction(
        string memory _title,
        string memory _description,
        string memory _category,
        string memory _assetSymbol,
        uint256 _votingPeriod,
        uint256 _stakeAmount
    ) external onlyMember nonReentrant returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_votingPeriod >= MIN_VOTING_PERIOD && _votingPeriod <= MAX_VOTING_PERIOD, "Invalid voting period");
        require(_stakeAmount >= MIN_STAKE, "Stake amount below minimum");
        require(FXRP_TOKEN_ADDRESS != address(0), "FXRP token address not set");
        
        // Check FXRP allowance
        IERC20 fxrp = IERC20(FXRP_TOKEN_ADDRESS);
        require(fxrp.allowance(msg.sender, address(this)) >= _stakeAmount, "Insufficient FXRP allowance");
        
        // Transfer FXRP stake from user to contract
        require(fxrp.transferFrom(msg.sender, address(this), _stakeAmount), "FXRP transfer failed");
        
        // Get FTSO price for the asset
        uint256 refPrice = 0;
        uint256 priceTimestamp = 0;
        uint8 priceDecimals = 0;
        bool priceSourceIsFTSO = false;
        
        // Try to get price from FTSO
        address ftsoAddress = ftsoContracts[_assetSymbol];
        if (ftsoAddress != address(0)) {
            try this.getLatestAssetPrice(_assetSymbol) returns (uint256 _price, uint8 _decimals, uint256 _timestamp) {
                refPrice = _price;
                priceTimestamp = _timestamp;
                priceDecimals = _decimals;
                priceSourceIsFTSO = true;
            } catch {
                // If FTSO call fails, price remains 0 and priceSourceIsFTSO stays false
                // This allows prediction creation even if FTSO is temporarily unavailable
            }
        }
        
        uint256 predictionId = nextPredictionId;
        nextPredictionId = nextPredictionId + 1;
        uint256 endTime = block.timestamp + _votingPeriod;
        
        predictions[predictionId] = Prediction({
            id: predictionId,
            creator: msg.sender,
            title: _title,
            description: _description,
            category: _category,
            assetSymbol: _assetSymbol,
            endTime: endTime,
            isActive: true,
            isApproved: false,
            totalVotes: 0,
            yesVotes: 0,
            noVotes: 0,
            createdAt: block.timestamp,
            refPriceAtSubmission: refPrice,
            priceTimestamp: priceTimestamp,
            priceDecimals: priceDecimals,
            priceSourceIsFTSO: priceSourceIsFTSO,
            stakedAmount: _stakeAmount,
            stakeTokenAddress: FXRP_TOKEN_ADDRESS
        });
        
        emit PredictionCreated(predictionId, msg.sender, _title, refPrice, _stakeAmount);
        return predictionId;
    }
    
    // ============ Voting Functions (unchanged from original) ============
    
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
    
    // ============ View Functions ============
    
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
    
    // ============ Member Management ============
    
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
    
    // ============ Stake Withdrawal (Demo - can be enhanced) ============
    
    /**
     * @notice Withdraw staked FXRP after prediction is finalized
     * @dev For demo purposes - in production, this could have conditions like:
     *      - Only if prediction was correct
     *      - Only after a certain time period
     *      - Partial withdrawal based on performance
     */
    function withdrawStake(uint256 _predictionId) external validPrediction(_predictionId) nonReentrant {
        Prediction storage prediction = predictions[_predictionId];
        
        require(msg.sender == prediction.creator, "Only creator can withdraw");
        require(!prediction.isActive, "Prediction still active");
        require(prediction.stakedAmount > 0, "No stake to withdraw");
        
        uint256 amount = prediction.stakedAmount;
        prediction.stakedAmount = 0;
        
        IERC20 fxrp = IERC20(FXRP_TOKEN_ADDRESS);
        require(fxrp.transfer(msg.sender, amount), "FXRP transfer failed");
        
        emit StakeWithdrawn(_predictionId, msg.sender, amount);
    }
}

