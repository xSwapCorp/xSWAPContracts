import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require('hardhat-tracer')
const config: HardhatUserConfig = {
  solidity: "0.6.6",
};

module.exports = {
  sourcify: {
    enabled: true
  },
  etherscan: {
    apiKey: "REAGJEZKBKI131U7ZIUHZKWTWE134HSV8S",
  },
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/akbepaolPZG8Qy-rcoEcgy6GFoSK0p8U",
      accounts: ["f9855ee6ab35cfd838058cc20ce4cd6a61fc455648913128c0272eac7220cd11"]
    }
  },
  solidity: {
    compilers: [
      {
        
        version: "0.5.16",
        settings : {
            optimizer : {
              enabled: true,
              runs: 200
            }
        }
      },
      {
        version: "0.6.6",
        settings : {
          optimizer : {
            enabled: true,
            runs: 200
          }
        }
      },
      
    ],
  },
};


