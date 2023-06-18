/*-----------------------------------------------------------
 @Filename:         OrderBookExchange.js
 @Copyright Author: Yogesh K
 @Date:             11/11/2022
-------------------------------------------------------------*/
const { ethers } = require("hardhat");
const { expect } = require('chai');


const tokens = (n) =>{
    return ethers.utils.parseUnits(n.toString(), 'ether');
}
describe('OrderBookExchange', () =>{

    let exchange, accounts, deployer, feeAccount, token1, token2
    const feePercent = 10

    beforeEach(async ()=>{
        const Exchange =  await ethers.getContractFactory('OrderBookExchange');
        const Token =  await ethers.getContractFactory('TokenERC20');

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]
        // get deployed instance of contract
        exchange = await Exchange.deploy(feeAccount.address, feePercent)
        token1 = await Token.deploy('KN Token', 'KNT', 1000000) // 1 million tokens
        token2 = await Token.deploy('Fake DAI', 'fDAI', 1000000) // 1 million tokens

        // transfer some tokens to user1
        let tx = await token1.connect(deployer).transfer(user1.address,tokens(100))
        await tx.wait() // wait for tx to mine
    })

    describe('Deployment', ()=>{
        it('tracks the fee account',async ()=>{
            expect(await exchange.feeAccount()).to.equal(feeAccount.address);
        })
        it('tracks the fee percent',async ()=>{
            expect(await exchange.feePercent()).to.equal(feePercent);
        })
    })

    describe('Depositing tokens', ()=>{
        let tx, result
        let amount = tokens(10)
        describe('Success', () =>{
            beforeEach(async() =>{
                //Deposit some tokens to exchange before withdrawal
                // Approve token
                tx = await token1.connect(user1).approve(exchange.address,amount)
                result = await tx.wait() // wait for tx to mine
                // Deposit token
                tx = await exchange.connect(user1).depositToken(token1.address,amount)
                result = await tx.wait() // wait for tx to mine
            })
            it('tracks token deposit', async()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.usertokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            })
            it('emits a Deposit event', async ()=>{
                const event = result.events[1] //2 events are emitted
                expect(event.event).to.equal('Deposit')

                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(amount)
            })
        })
        describe('Failure', () =>{

            it('fails when no tokens are approved',async ()=>{
               await expect(exchange.connect(user1).depositToken(token1.address,amount)).to.be.reverted
            })
       })
    })


    describe('Withdrawing tokens', ()=>{
        let tx, result
        let amount = tokens(10)
        describe('Success', () =>{
            beforeEach(async() =>{
                //Deposit some tokens to exchange before withdrawal
                // Approve token
                tx = await token1.connect(user1).approve(exchange.address,amount)
                result = await tx.wait() // wait for tx to mine
                // Deposit token
                tx = await exchange.connect(user1).depositToken(token1.address,amount)
                result = await tx.wait() // wait for tx to mine
                // Finally withdraw tokens
                tx = await exchange.connect(user1).withdrawToken(token1.address,amount)
                result = await tx.wait() // wait for tx to mine
            })
            it('withdraw tokens', async()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(0)
                expect(await exchange.usertokens(token1.address, user1.address)).to.equal(0)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
            })

            it('emits a Withdraw event', async ()=>{
                const event = result.events[1] //2 events are emitted
                expect(event.event).to.equal('Withdraw')

                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(0)
            })
        })
        describe('Failure', () =>{
            it('fails for insufficient balances',async ()=>{
               await expect(exchange.connect(user1).withdrawToken(token1.address,amount)).to.be.reverted
            })
       })
    })

    describe('Token balances', ()=>{
        let tx, result
        let amount = tokens(21)
        beforeEach(async() =>{
            // Deposit some tokens to exchange before making order
            // Approve token
            tx = await token1.connect(user1).approve(exchange.address,amount)
            result = await tx.wait() // wait for tx to mine
            // Deposit token
            tx = await exchange.connect(user1).depositToken(token1.address,amount)
            result = await tx.wait() // wait for tx to mine
        })
        it('tracks token balances', async()=>{
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
        })
    })

    describe('Making orders', ()=>{
        let tx, result
        let amount = tokens(10)
        describe('Success', () =>{
            beforeEach(async() =>{
                //Deposit some tokens to exchange before making order
                // Approve token
                tx = await token1.connect(user1).approve(exchange.address,amount)
                result = await tx.wait() // wait for tx to mine
                // Deposit token
                tx = await exchange.connect(user1).depositToken(token1.address,amount)
                result = await tx.wait() // wait for tx to mine
                // Make order
                tx = await exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))
                result = await tx.wait() // wait for tx to mine
            })

            it('tracks the newly created order', async()=>{
                expect(await exchange.orderCount()).to.equal(1)
            })
            it('emits an Order event', async ()=>{
                const event = result.events[0]
                expect(event.event).to.equal('Order')

                const args = event.args
                expect(args.id).to.equal(1)
                expect(args.user).to.equal(user1.address)
                expect(args.tokenGet).to.equal(token2.address)
                expect(args.amountGet).to.equal(tokens(1))
                expect(args.tokenGive).to.equal(token1.address)
                expect(args.amountGive).to.equal(tokens(1))
                expect(args.timestamp).to.at.least(1)
            })
        })

        describe('Failure', () =>{
            it('rejects if there is no balance',async ()=>{
               await expect(exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))).to.be.reverted
            })
       })
    })
    describe('Order operations', ()=>{
        let tx, result
        let amount = tokens(1)
        beforeEach(async() =>{
                // Deposit token1 to Exchange
                // Approve token
                tx = await token1.connect(user1).approve(exchange.address,amount)
                result = await tx.wait() // wait for tx to mine
                // Deposit token
                tx = await exchange.connect(user1).depositToken(token1.address,amount)
                result = await tx.wait() // wait for tx to mine

                // Give some tokens to user2
                tx = await token2.connect(deployer).transfer(user2.address,tokens(100))
                await tx.wait() // wait for tx to mine
                // Deposit token2 to Exchange
                // Approve token
                tx = await token2.connect(user2).approve(exchange.address,tokens(2))
                result = await tx.wait() // wait for tx to mine
                // Deposit token
                tx = await exchange.connect(user2).depositToken(token2.address,tokens(2))
                result = await tx.wait() // wait for tx to mine

                // Make order
                tx = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
                result = await tx.wait() // wait for tx to mine
            })
        describe('Cancel order', () =>{
            describe('Success', () =>{
                beforeEach(async() =>{
                    tx = await exchange.connect(user1).cancelOrder(1)
                    result = await tx.wait() // wait for tx to mine
                })
                it('updates cancelled order map', async()=>{
                    expect(await exchange.orderCancelled(1)).to.equal(true)
                })
                it('emits a Cancel event', async ()=>{
                    const event = result.events[0]
                    expect(event.event).to.equal('Cancel')

                    const args = event.args
                    expect(args.id).to.equal(1)
                    expect(args.user).to.equal(user1.address)
                    expect(args.tokenGet).to.equal(token2.address)
                    expect(args.amountGet).to.equal(tokens(1))
                    expect(args.tokenGive).to.equal(token1.address)
                    expect(args.amountGive).to.equal(tokens(1))
                    expect(args.timestamp).to.at.least(1)
                })
            })
            describe('Failure', () =>{
                let invalidOrderid = 99999

                it('rejects invalid order id', async()=>{
                   await expect(exchange.cancelOrder(invalidOrderid)).to.be.reverted
                })

                it('rejects unauthorized cancellations', async()=>{
                   await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
                })
            })
        })

        describe('Execute orders', () =>{
            describe('Success', () => {
                beforeEach(async() =>{
                    // user2 executes order
                    tx = await exchange.connect(user2).executeOrder(1)
                    result = await tx.wait() // wait for tx to mine
                })
                it('executes trade and charge fees', async()=>{
                    // Check Give token
                    expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
                    expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(tokens(1))
                    expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(0)

                    // Check Get token
                    expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(1))
                    expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(0.9))
                    expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(tokens(0.1))
                })
                it('updates completed orders', async()=>{
                    expect(await exchange.orderCompleted(1)).to.equal(true)
                })
                it('emits a Trade event', async ()=>{
                    const event = result.events[0]
                    expect(event.event).to.equal('Trade')

                    const args = event.args
                    expect(args.id).to.equal(1)
                    expect(args.user).to.equal(user2.address)
                    expect(args.tokenGet).to.equal(token2.address)
                    expect(args.amountGet).to.equal(tokens(1))
                    expect(args.tokenGive).to.equal(token1.address)
                    expect(args.amountGive).to.equal(tokens(1))
                    expect(args.creator).to.equal(user1.address)
                    expect(args.timestamp).to.at.least(1)
                })
            })

            describe('Failure', () => {
                let invalidOrderid = 99999
                it('reject invalid order id', async()=>{
                    await expect(exchange.connect(user2).executeOrder(invalidOrderid)).to.be.reverted
                })
                it('reject already completed order', async()=>{
                    tx = await exchange.connect(user2).executeOrder(1)
                    result = await tx.wait() // wait for tx to mine
                    await expect(exchange.connect(user2).executeOrder(1)).to.be.reverted
                })

                it('reject already cancelled order', async()=>{
                    tx = await exchange.connect(user1).cancelOrder(1)
                    result = await tx.wait() // wait for tx to mine
                    await expect(exchange.connect(user2).executeOrder(1)).to.be.reverted
                })
            })
        })
    })
})