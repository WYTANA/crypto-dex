async function main() {
  // eslint-disable-next-line no-undef
  const Token = await ethers.getContractFactory("Token")

  const token = await Token.deploy()
  await token.deployed()
  console.log(`Token address: ${token.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
