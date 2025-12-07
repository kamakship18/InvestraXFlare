/**
 * Deployment script for PredictionDAOWithFlare on Flare Coston testnet
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting PredictionDAOWithFlare deployment to Flare Coston...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "CFLR");

  if (balance === 0n) {
    console.error("❌ No balance! Get CFLR from faucet.");
    process.exit(1);
  }

  // Get contract factory
  const PredictionDAOWithFlare = await ethers.getContractFactory("PredictionDAOWithFlare");

  console.log("📦 Deploying...\n");
  const predictionDAO = await PredictionDAOWithFlare.deploy();

  await predictionDAO.waitForDeployment();
  const address = await predictionDAO.getAddress();

  console.log("✅ Deployed at:", address);

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "flare-coston-address.json"),
    JSON.stringify({ address }, null, 2)
  );

  console.log("💾 Saved address to deployments folder!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  });
