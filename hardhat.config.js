require("@nomiclabs/hardhat-waffle")
require("dotenv").config()

module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {},
  },
}
