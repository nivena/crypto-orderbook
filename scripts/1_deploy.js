async function main() {
  console.log('Preparing for deployment')
  // Fetch contract before deploy
  const Token = await ethers.getContractFactory("TokenERC20")
  const Exchange = await ethers.getContractFactory("OrderBookExchange")

  // fetch accounts
  const accounts = await ethers.getSigners()
  console.log(`Accounts:\n ${accounts[0].address}\n ${accounts[1].address}`)

  // Deploy contracts
  const kn = await Token.deploy('KN Token', 'KNT', 1000000)
  await kn.deployed()
  console.log(`KN deployed at: ${kn.address}`)

  const fETH = await Token.deploy('fETH', 'fETH',1000000)
  await fETH.deployed()
  console.log(`fETH deployed at: ${fETH.address}`)

  const fDAI = await Token.deploy('fDAI', 'fDAI',1000000)
  await fDAI.deployed()
  console.log(`fDAI deployed at: ${fDAI.address}`)


  const exchange = await Exchange.deploy(accounts[1].address, 10)
  await exchange.deployed()
  console.log(`Exchange deployed at: ${exchange.address}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
