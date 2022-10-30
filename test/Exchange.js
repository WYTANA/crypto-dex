const { expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Exchange", () => {
  let deployer, feeAccount, exchange, token1, token2, accounts, user1, user2

  const feePercent = 10

  beforeEach(async () => {
    const Exchange = await ethers.getContractFactory("Exchange")
    const Token = await ethers.getContractFactory("Token")

    token1 = await Token.deploy("Black Hills Digital Token", "BHDT", "1000000")
    token2 = await Token.deploy("Mock Dai", "mDAI", "1000000")

    accounts = await ethers.getSigners()
    deployer = accounts[0]
    feeAccount = accounts[1]
    user1 = accounts[2]
    user2 = accounts[3]

    let transaction = await token1
      .connect(deployer)
      .transfer(user1.address, tokens("100"))
    await transaction.wait()

    exchange = await Exchange.deploy(feeAccount.address, feePercent)
  })

  describe("Deployment", () => {
    it("tracks the fee account", async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address)
    })

    it("tracks the fee percent", async () => {
      expect(await exchange.feePercent()).to.equal(feePercent)
    })
  })

  describe("Depositing Tokens", () => {
    let transaction, result
    let amount = tokens(10)

    describe("Successfully", () => {
      beforeEach(async () => {
        // 1) Approve the token
        // console.log(user1.address, exchange.address, amount.toString())
        transaction = await token1
          .connect(user1)
          .approve(exchange.address, amount)
        result = await transaction.wait()
        // 2) Deposit the token
        transaction = await exchange
          .connect(user1)
          .depositToken(token1.address, amount)
        result = await transaction.wait()
      })

      it("tracks the token deposit", async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(amount)
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(
          amount
        )
        expect(
          await exchange.balanceOf(token1.address, user1.address)
        ).to.equal(amount)
      })

      it("emits a deposit event", async () => {
        // find the second event
        const event = result.events[1]
        expect(event.event).to.equal("Deposit")

        const args = event.args
        expect(args.token).to.equal(token1.address)
        expect(args.user).to.equal(user1.address)
        expect(args.amount).to.equal(amount)
        expect(args.balance).to.equal(amount)
      })
    })

    describe("Fails", () => {
      it("when no tokens are approved", async () => {
        // No approval
        await expect(
          exchange.connect(user1).depositToken(token1.address, amount)
        ).to.be.reverted
      })
    })
  })

  describe("Withdrawing Tokens", () => {
    let transaction, result
    let amount = tokens(10)

    describe("Successfully", () => {
      beforeEach(async () => {
        // Deposit tokens before withdrawal
        // 1) Approve the token
        transaction = await token1
          .connect(user1)
          .approve(exchange.address, amount)
        result = await transaction.wait()
        // 2) Deposit the token
        transaction = await exchange
          .connect(user1)
          .depositToken(token1.address, amount)
        result = await transaction.wait()
        // 3) Withdraw tokens
        transaction = await exchange
          .connect(user1)
          .withdrawToken(token1.address, amount)
        result = await transaction.wait()
      })

      it("returns user balance", async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(0)
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
        expect(
          await exchange.balanceOf(token1.address, user1.address)
        ).to.equal(0)
      })

      it("emits a withdraw event", async () => {
        // find the second event
        const event = result.events[1]
        expect(event.event).to.equal("Withdraw")

        const args = event.args
        expect(args.token).to.equal(token1.address)
        expect(args.user).to.equal(user1.address)
        expect(args.amount).to.equal(amount)
        expect(args.balance).to.equal(0)
      })
    })

    describe("Fails", () => {
      it("for insufficient balances", async () => {
        // Attempt withdrawal with no deposit
        await expect(
          exchange.connect(user1).withdrawToken(token1.address, amount)
        ).to.be.reverted
      })
    })
  })

  describe("Checking Balances", () => {
    let transaction
    let amount = tokens(1)
    let result

    beforeEach(async () => {
      // 1) Approve the token
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount)
      result = await transaction.wait()
      // 2) Deposit the token
      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount)
      result = await transaction.wait()
    })

    it("returns user balance", async () => {
      expect(await token1.balanceOf(exchange.address)).to.equal(amount)
    })
  })

  describe("Making orders", async () => {
    let transaction, result
    let amount = tokens(1)

    describe("Successfully", async () => {
      beforeEach(async () => {
        // Deposit tokens before making order
        // 1) Approve the token
        transaction = await token1
          .connect(user1)
          .approve(exchange.address, amount)
        result = await transaction.wait()
        // 2) Deposit the token
        transaction = await exchange
          .connect(user1)
          .depositToken(token1.address, amount)
        result = await transaction.wait()
        // 3) Make order
        transaction = await exchange
          .connect(user1)
          .makeOrder(token2.address, amount, token1.address, amount)
        result = await transaction.wait()
      })

      it("tracks the new order", async () => {
        expect(await exchange.orderCount()).to.equal(1)
      })

      it("emits an order event", async () => {
        const event = result.events[0]
        expect(event.event).to.equal("Order")

        const args = event.args
        expect(args.id).to.equal(1)
        expect(args.user).to.equal(user1.address)
        expect(args.tokenGet).to.equal(token2.address)
        expect(args.amountGet).to.equal(amount)
        expect(args.tokenGive).to.equal(token1.address)
        expect(args.amountGive).to.equal(amount)
        expect(args.timestamp).to.at.least(1)
      })
    })
    describe("Fails", async () => {
      it(" by rejecting with no balance", async () => {
        await expect(
          exchange
            .connect(user1)
            .makeOrder(token2.address, amount, token1.address, amount)
        ).to.be.reverted
      })
    })
  })

  describe("Order actions", async () => {
    let transaction, result
    let amount = tokens(1)

    beforeEach(async () => {
      // 1) Approve the token
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount)
      result = await transaction.wait()
      // 2) Deposit the token
      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount)
      result = await transaction.wait()
      // 3) Give tokens to user2
      transaction = await token2
        .connect(deployer)
        .transfer(user2.address, tokens(100))
      result = await transaction.wait()
      // 4) Approve user2
      transaction = await token2
        .connect(user2)
        .approve(exchange.address, tokens(2))
      result = await transaction.wait()
      // 5) Deposit the token
      transaction = await exchange
        .connect(user2)
        .depositToken(token2.address, tokens(2))
      result = await transaction.wait()
      // 6) Make order
      transaction = await exchange
        .connect(user1)
        .makeOrder(token2.address, amount, token1.address, amount)
      result = await transaction.wait()
    })

    describe("Cancelling orders", async () => {
      describe("Successfully", async () => {
        beforeEach(async () => {
          transaction = await exchange.connect(user1).cancelOrder(1)
          result = await transaction.wait()
        })

        it("updates canceled orders", async () => {
          expect(await exchange.orderCancelled(1)).to.equal(true)
        })

        it("emits a cancel event", async () => {
          const event = result.events[0]
          expect(event.event).to.equal("Cancel")

          const args = event.args
          expect(args.id).to.equal(1)
          expect(args.user).to.equal(user1.address)
          expect(args.tokenGet).to.equal(token2.address)
          expect(args.amountGet).to.equal(amount)
          expect(args.tokenGive).to.equal(token1.address)
          expect(args.amountGive).to.equal(amount)
          expect(args.timestamp).to.at.least(1)
        })
      })
      describe("Fails", async () => {
        beforeEach(async () => {
          // 1) Approve the token
          transaction = await token1
            .connect(user1)
            .approve(exchange.address, amount)
          result = await transaction.wait()
          // 2) Deposit the token
          transaction = await exchange
            .connect(user1)
            .depositToken(token1.address, amount)
          result = await transaction.wait()
          // 3) Make order
          transaction = await exchange
            .connect(user1)
            .makeOrder(token2.address, amount, token1.address, amount)
          result = await transaction.wait()
        })

        it("by rejecting invalid order IDs", async () => {
          // create invalid order to check
          const invalidOrderId = 99999
          await expect(exchange.connect(user1).cancelOrder(invalidOrderId)).to
            .be.reverted
        })

        it("by rejecting unauthorized cancellations", async () => {
          await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
        })
      })
    })

    describe("Filling orders", async () => {
      describe("Successfully", () => {
        beforeEach(async () => {
          // user 2 fills the order
          transaction = await exchange.connect(user2).fillOrder("1")
          result = await transaction.wait()
        })
        // Token Give
        it("executes the trade and charges the fee", async () => {
          expect(
            await exchange.balanceOf(token1.address, user1.address)
          ).to.equal(tokens(0))
          expect(
            await exchange.balanceOf(token1.address, user2.address)
          ).to.equal(tokens(1))
          expect(
            await exchange.balanceOf(token1.address, feeAccount.address)
          ).to.equal(tokens(0))
          // Token Give
          expect(
            await exchange.balanceOf(token2.address, user1.address)
          ).to.equal(tokens(1))
          expect(
            await exchange.balanceOf(token2.address, user2.address)
          ).to.equal(tokens(0.9))
          expect(
            await exchange.balanceOf(token2.address, feeAccount.address)
          ).to.equal(tokens(0.1))
        })

        it("updates filled orders", async () => {
          expect(await exchange.orderFilled(1)).to.equal(true)
        })

        it("emits a trade event", async () => {
          const event = result.events[0]
          expect(event.event).to.equal("Trade")

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

      describe("Fails", () => {
        it("by rejecting invalid order IDs", async () => {
          const invalidOrderId = 9999
          await expect(exchange.connect(user2).fillOrder(invalidOrderId)).to.be
            .reverted
        })

        it("by rejecting already filled orders", async () => {
          transaction = await exchange.connect(user2).fillOrder(1)
          await transaction.wait()
          await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
        })

        it("by rejecting cancelled orders", async () => {
          transaction = await exchange.connect(user1).cancelOrder(1)
          await transaction.wait()
          await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
        })
      })
    })
  })
})
