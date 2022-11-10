const { ethers } = require("hardhat")
const config = require("../src/config.json")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether")
}

const wait = (seconds) => {
  const milliseconds = seconds * 1000
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function main() {
  // Fetch accounts from wallet - unlocked
  const accounts = await ethers.getSigners()

  // Fetch network
  const { chainId } = await ethers.provider.getNetwork()
  console.log(`\nUsing chainId: ${chainId}\n`)

  // Fetch deployed tokens
  const Bhdt = await ethers.getContractAt("Token", config[chainId].Bdht.address)
  console.log(`BHDT fetched: ${Bhdt.address}\n`)

  const mETH = await ethers.getContractAt("Token", config[chainId].mETH.address)
  console.log(`mETH fetched: ${mETH.address}\n`)

  const mDAI = await ethers.getContractAt("Token", config[chainId].mDAI.address)
  console.log(`mDAI fetched: ${mDAI.address}\n`)

  // Fetch the deployed exchange
  const exchange = await ethers.getContractAt(
    "Exchange",
    config[chainId].exchange.address
  )
  console.log(`Exchange fetched: ${exchange.address}\n`)

  // Give tokens to account[1]
  const sender = accounts[0]
  const receiver = accounts[1]
  let amount = tokens(10000)

  // User1 transfers 10k mETH
  let transaction, result
  transaction = await mETH.connect(sender).transfer(receiver.address, amount)
  console.log(
    `Transferred ${amount} mETH tokens from ${sender.address} to ${receiver.address}\n`
  )

  // Set up exchange users
  const user1 = accounts[0]
  const user2 = accounts[1]
  amount = tokens(10000)

  // User1 approves 10k BHDT
  transaction = await Bhdt.connect(user1).approve(exchange.address, amount)
  await transaction.wait()
  console.log(`Approved ${amount} BHDT tokens from ${user1.address}`)

  // User1 deposits 10k BHDT
  transaction = await exchange.connect(user1).depositToken(Bhdt.address, amount)
  await transaction.wait()
  console.log(`Deposited ${amount} BHDT tokens from ${user1.address}\n`)

  // User2 approves 10k mETH
  transaction = await mETH.connect(user2).approve(exchange.address, amount)
  await transaction.wait()
  console.log(`Approved ${amount} mETH tokens from ${user2.address}`)

  // User2 deposits 10k mETH
  transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
  await transaction.wait()
  console.log(`Deposited ${amount} mETH tokens from ${user2.address}\n`)

  /////////////////////////////////////////////////////////
  // *** Seed A Cancelled Order *** //

  // User1 makes order to get tokens
  let orderId
  transaction = await exchange
    .connect(user1)
    .makeOrder(mETH.address, tokens(100), Bhdt.address, tokens(5))
  result = await transaction.wait()
  console.log(`Made order from ${user1.address}`)

  // User1 cancels order
  orderId = result.events[0].args.id
  transaction = await exchange.connect(user1).cancelOrder(orderId)
  result = await transaction.wait()
  console.log(`Cancelled order from ${user1.address}\n`)

  // Wait one second
  await wait(1)

  /////////////////////////////////////////////////////////
  // *** Seed A Cancelled Order *** //

  // User1 makes order
  transaction = await exchange
    .connect(user1)
    .makeOrder(mETH.address, tokens(100), Bhdt.address, tokens(10))
  result = await transaction.wait()
  console.log(`Made order from ${user1.address}`)

  // User2 fills order
  orderId = result.events[0].args.id
  transaction = await exchange.connect(user2).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled order from ${user1.address}\n`)

  // Wait one second
  await wait(1)

  // User1 makes another order
  transaction = await exchange
    .connect(user1)
    .makeOrder(mETH.address, tokens(50), Bhdt.address, tokens(15))
  result = await transaction.wait()
  console.log(`Made another order from ${user1.address}`)

  // User2 fills another order
  orderId = result.events[0].args.id
  transaction = await exchange.connect(user2).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled another order from ${user1.address}\n`)

  // Wait one second
  await wait(1)

  // User1 makes final order
  transaction = await exchange
    .connect(user1)
    .makeOrder(mETH.address, tokens(200), Bhdt.address, tokens(20))
  result = await transaction.wait()
  console.log(`Made final order from ${user1.address}`)

  // User2 fills final order
  orderId = result.events[0].args.id
  transaction = await exchange.connect(user2).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled final order from ${user1.address}\n`)

  // Wait one second
  await wait(1)

  /////////////////////////////////////////////////////////
  // *** Seed Orders *** //

  // User1 makes ten orders
  for (let i = 1; i <= 10; i++) {
    transaction = await exchange
      .connect(user1)
      .makeOrder(mETH.address, tokens(10 * i), Bhdt.address, tokens(10))
    result = await transaction.wait()

    console.log(`Made order from ${user1.address}`)

    // Wait one second
    await wait(1)
  }

  // User2 makes ten orders
  for (let i = 1; i <= 10; i++) {
    transaction = await exchange
      .connect(user2)
      .makeOrder(Bhdt.address, tokens(10), mETH.address, tokens(10 * i))
    result = await transaction.wait()

    console.log(`Made order from ${user2.address}`)

    // Wait one second
    await wait(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
