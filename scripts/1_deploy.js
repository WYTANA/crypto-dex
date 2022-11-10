const { ethers } = require("hardhat")

async function main() {
  console.log(`Preparing deployment ...\n`)

  // Fetch contract for deployment
  const Token = await ethers.getContractFactory("Token")
  const Exchange = await ethers.getContractFactory("Exchange")

  // Fetch accounts
  const accounts = await ethers.getSigners()
  console.log(
    `\nAccounts fetched:\n${accounts[0].address}\n${accounts[1].address}\n`
  )

  // Deploy contracts
  const bhdt = await Token.deploy(
    "Black Hills Digital Token",
    "BHDT",
    "1000000"
  )
  await bhdt.deployed()
  console.log(`BHDT deployed to: ${bhdt.address}`)

  const mETH = await Token.deploy("mETH", "mETH", "1000000")
  await mETH.deployed()
  console.log(`mETH deployed to: ${mETH.address}`)

  const mDAI = await Token.deploy("mDAI", "mDAI", "1000000")
  await mDAI.deployed()
  console.log(`mDAI deployed to: ${mDAI.address}`)

  const exchange = await Exchange.deploy(accounts[1].address, 10)
  await exchange.deployed()
  console.log(`Exchange deployed to: ${exchange.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
