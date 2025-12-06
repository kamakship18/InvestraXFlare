/**
 * Deployment script for PredictionDAOWithFlare on Flare Coston2 testnet
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-flare.js --network coston2
 * 
 * Prerequisites:
 *   1. Set PRIVATE_KEY in .env file
 *   2. Get testnet C2FLR from faucet: https://faucet.towolabs.com/
 *   3. Update FXRP_TOKEN_ADDRESS in contract with actual testnet address
 *   4. Update FTSO contract addresses in contract constructor
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting PredictionDAOWithFlare deployment to Flare Coston2...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "C2FLR\n");

  if (balance === 0n) {
    console.error("❌ Error: Account has no balance!");
    console.log("💡 Get testnet tokens from: https://faucet.towolabs.com/");
    process.exit(1);
  }

  // Get the contract factory
  const PredictionDAOWithFlare = await ethers.getContractFactory("PredictionDAOWithFlare");
  console.log("📦 Deploying PredictionDAOWithFlare contract...\n");

  // Deploy the contract
  const predictionDAO = await PredictionDAOWithFlare.deploy();

  // Wait for deployment
  await predictionDAO.waitForDeployment();
  const contractAddress = await predictionDAO.getAddress();

  console.log("✅ PredictionDAOWithFlare deployed to:", contractAddress);
  console.log("👤 Contract owner:", await predictionDAO.owner());
  console.log("🔗 Network: Flare Coston2 Testnet (Chain ID: 114)\n");

  // Get contract info
  const minStake = await predictionDAO.MIN_STAKE();
  const fxrpAddress = await predictionDAO.FXRP_TOKEN_ADDRESS();

  console.log("📋 Contract Configuration:");
  console.log("  - Minimum Stake:", ethers.formatEther(minStake), "FXRP");
  console.log("  - FXRP Token Address:", fxrpAddress);
  console.log("  - Voting Threshold: 70%");
  console.log("  - Min Voting Period: 1 day");
  console.log("  - Max Voting Period: 7 days\n");

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    owner: deployer.address,
    network: "coston2",
    chainId: 114,
    deployedAt: new Date().toISOString(),
    minStake: ethers.formatEther(minStake),
    fxrpTokenAddress: fxrpAddress,
    votingThreshold: "70%",
    minVotingPeriod: "1 day",
    maxVotingPeriod: "7 days"
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save to JSON file
  const deploymentPath = path.join(deploymentsDir, 'flare-coston2.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentPath);

  // Also save a simple address file for frontend
  const addressPath = path.join(deploymentsDir, 'flare-coston2-address.json');
  fs.writeFileSync(addressPath, JSON.stringify({ address: contractAddress }, null, 2));
  console.log("💾 Contract address saved to:", addressPath);

  console.log("\n🎉 Deployment completed successfully!\n");
  console.log("📝 Next steps:");
  console.log("1. Update frontend/lib/flareConfig.js with contract address:", contractAddress);
  console.log("2. Set FTSO contract addresses using setFTSOContract() function");
  console.log("3. Update FXRP_TOKEN_ADDRESS constant in contract if needed");
  console.log("4. Add DAO members using addMember() function");
  console.log("5. Test prediction creation with FTSO price and FXRP staking\n");

  console.log("🔗 View on explorer:");
  console.log(`   https://coston2-explorer.flare.network/address/${contractAddress}\n`);

  return {
    contractAddress,
    deploymentInfo
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log(`\n✅ Contract deployed at: ${result.contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });

