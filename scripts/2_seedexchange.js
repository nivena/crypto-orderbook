const { ethers } = require('hardhat');
const config = require('../src/config.json')
const tokens = (n) =>{
    return ethers.utils.parseUnits(n.toString(), 'ether');
}
const wait =(seconds) =>{
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
async function main() {

    const accounts = await ethers.getSigners()

    // fetch network
    const {chainId} = await ethers.provider.getNetwork()
    console.log('Using chain ID:', chainId)


    // fetch deployed tokens contract instance
    const kn = await ethers.getContractAt('TokenERC20', config[chainId].KN.address)
    console.log(`KN Token fetched: ${kn.address}\n`)

    const fETH = await ethers.getContractAt('TokenERC20', config[chainId].fETH.address)
    console.log(`fETH Token fetched: ${fETH.address}\n`)


    const fDAI = await ethers.getContractAt('TokenERC20', config[chainId].fDAI.address)
    console.log(`fDAI Token fetched: ${fDAI.address}\n`)

    // fetch the deployed exchange contract instance
    const exchange = await ethers.getContractAt('OrderBookExchange', config[chainId].exchange.address)
    console.log(`Exchange fetched: ${exchange.address}\n`)

    // ..................Distribute tokens..................................
    // Give tokens to receiver - accounts[1]
    const sender = accounts[0]
    const receiver = accounts[1]
    let amount = tokens(10000)
    let tx, result

    // user1 transfers 10000 fETH to user2
    tx = await fETH.connect(sender).transfer(receiver.address,amount)
    console.log(`Transferred ${amount} from ${sender.address} to ${receiver.address}\n`)
    // setup exchange users
    const user1 = accounts[0]
    const user2 = accounts[1]

    //............. Deposit tokens to exchange....................

    // user1 approves 10000 KN tokens to exchange
    tx = await kn.connect(user1).approve(exchange.address,amount)
    result = await tx.wait() // wait for tx to mine
    console.log(`Approved ${amount} KN tokens from ${user1.address}`)

    // user1 deposits KN tokens to exchange
    tx = await exchange.connect(user1).depositToken(kn.address,amount)
    result = await tx.wait() // wait for tx to mine
    console.log(`User1 deposited ${amount} KN tokens to ${exchange.address}\n`)


    // user2 approves 10000 fETH tokens to exchange
    tx = await fETH.connect(user2).approve(exchange.address,amount)
    result = await tx.wait() // wait for tx to mine
    console.log(`Approved ${amount} fETH tokens from ${user2.address}`)

    // user2 deposits 10000 fETH to exchange
    tx = await exchange.connect(user2).depositToken(fETH.address,amount)
    result = await tx.wait() // wait for tx to mine
    console.log(`User2 deposited ${amount} fETH tokens to ${exchange.address}\n`)

//.......................... Seed Make and Cancel orders..........................
    //user1 makes order
    let orderId
    tx = await exchange.connect(user1).makeOrder(fETH.address, tokens(100), kn.address, tokens(5))
    result = await tx.wait() // wait for tx to mine
    console.log(`Make order for ${user1.address}`)

    // user1 cancels orders
    orderId = result.events[0].args.id
    tx = await exchange.connect(user1).cancelOrder(orderId)
    result = await tx.wait() // wait for tx to mine
    console.log(`Cancelled order from ${user1.address}\n`)

    await wait(1) // wait 1 sec

    //....................... Seed Execute orders.......................
    //user1 makes order
    tx = await exchange.connect(user1).makeOrder(fETH.address, tokens(100), kn.address, tokens(10))
    result = await tx.wait() // wait for tx to mine
    console.log(`Make order for ${user1.address}`)

    // user2 executes order
    orderId = result.events[0].args.id
    tx = await exchange.connect(user2).executeOrder(orderId)
    result = await tx.wait() // wait for tx to mine
    console.log(`Execute order of ${user1.address}\n`)

    await wait(1) // wait 1 sec

    //user1 makes 2nd order
    tx = await exchange.connect(user1).makeOrder(fETH.address, tokens(50), kn.address, tokens(15))
    result = await tx.wait() // wait for tx to mine
    console.log(`Make order for ${user1.address}`)

    // user2 executes order
    orderId = result.events[0].args.id
    tx = await exchange.connect(user2).executeOrder(orderId)
    result = await tx.wait() // wait for tx to mine
    console.log(`Execute order of ${user1.address}\n`)

    await wait(1) // wait 1 sec


    //user1 makes final order
    tx = await exchange.connect(user1).makeOrder(fETH.address, tokens(200), kn.address, tokens(20))
    result = await tx.wait() // wait for tx to mine
    console.log(`Make order for ${user1.address}`)

    // user2 executes order
    orderId = result.events[0].args.id
    tx = await exchange.connect(user2).executeOrder(orderId)
    result = await tx.wait() // wait for tx to mine
    console.log(`Execute order of ${user1.address}\n`)

    await wait(1) // wait 1 sec

    // .........................Seed open orders....................

    // user1 makes 10 orders

    for (let i= 1; i<=10; i++){
        tx = await exchange.connect(user1).makeOrder(fETH.address, tokens(10 * i), kn.address, tokens(10))
        result = await tx.wait() // wait for tx to mine
        console.log(`Make order for ${user1.address}`)
        await wait(1) // wait 1 sec
    }

    // user2 makes 10 orders
    for (let i= 1; i<=10; i++){
        tx = await exchange.connect(user2).makeOrder(kn.address, tokens(10),fETH.address, tokens(10 * i))
        result = await tx.wait() // wait for tx to mine
        console.log(`Make order for ${user2.address}`)
        await wait(1) // wait 1 sec
    }

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});