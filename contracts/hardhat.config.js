require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // 🔹 Flare Coston (where you have 100 CFLR)
    coston: {
      url: "https://coston-api.flare.network/ext/bc/C/rpc",
      chainId: 16,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 30000000000, // 30 gwei (above 25 gwei min)
    },    
    // 🔹 Coston2 (optional)
    coston2: {
      url: "https://coston2-api.flare.network/ext/bc/C/rpc",
      chainId: 114,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 20000000000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
