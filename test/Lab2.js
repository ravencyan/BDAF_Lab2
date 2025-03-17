const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require('@nomicfoundation/hardhat-network-helpers');

describe("Lock contract", function () {
    let reward_contract, rewardContract;
    let owner, addr1, addr2;
    let startTime, endTime;
    let lockedBalance, total_funds;

    this.beforeEach(async function () {
        [owner, addr1, addr2] =  await ethers.getSigners(); 
        reward_contract = await ethers.getContractFactory("Lab2");
        rewardContract = await reward_contract.deploy(owner.address);
        startTime = (await time.latest()) + 100;
        endTime = startTime + 200;
        await rewardContract.setStartTime(startTime);
        await rewardContract.setEndTime(endTime);
    });

    it("Should NOT allow locking ETH before start time", async function () {
        await expect(
            //Call lock function with 1 ETH sent (2nd param)
            rewardContract.connect(addr1).lock(ethers.parseEther("1.0"), {value: ethers.parseEther("1.0")})
        ).to.be.revertedWith("Unable to lock before start time");
    });

    it("Should allow locking ETH after start time and before end time", async function () {
        await time.increaseTo(startTime);
        await expect(
            rewardContract.connect(addr1).lock(ethers.parseEther("1.0"), {value: ethers.parseEther("1.0")})
        ).to.not.be.reverted;

        expect(await ethers.provider.getBalance(await rewardContract.getAddress())).to.equal(ethers.parseEther("1.0"));
    })

    it("Should NOT allow locking ETH after end time", async function () {
        await time.increaseTo(endTime + 1);
        await expect(
            rewardContract.connect(addr1).lock(ethers.parseEther("1.0"), {value: ethers.parseEther("1.0")})
        ).to.be.revertedWith("Unable to lock after end time");
    });

    it("Alice's case", async function () {
        await time.increaseTo(startTime);
        await expect(
            rewardContract.connect(addr1).lock(ethers.parseEther("1.0"), {value: ethers.parseEther("1.0")})
        ).to.not.be.reverted;

        //Check balance of locked funds & total funds
        lockedBalance = await rewardContract.getLockedBalance(addr1.address);
        expect(lockedBalance.toString()).to.equal(ethers.parseEther("1.0"));
        total_funds = await rewardContract.getTotalFunds();
        expect(total_funds.toString()).to.equal(ethers.parseEther("1.0"));

        await time.increaseTo(endTime);
        await expect(
            rewardContract.connect(addr1).unlock()
        ).to.not.be.reverted;
        //Automatically checks if ETH are returned & the reward tokens are given 
        //(payable function not reverted)

        lockedBalance = await rewardContract.getLockedBalance(addr1.address);
        expect(lockedBalance).to.equal(ethers.parseEther("0"));
        total_funds = await rewardContract.getTotalFunds();
        expect(total_funds.toString()).to.equal(ethers.parseEther("0"));
    });

    it("Bob's case", async function () {
        await time.increaseTo(startTime);
        await expect(
            rewardContract.connect(addr2).lock(ethers.parseEther("3.0"), {value: ethers.parseEther("3.0")})
        ).to.not.be.reverted;

        //
        lockedBalance = await rewardContract.getLockedBalance(addr2.address);
        expect(lockedBalance.toString()).to.equal(ethers.parseEther("3.0"));
        total_funds = await rewardContract.getTotalFunds();
        expect(total_funds.toString()).to.equal(ethers.parseEther("3.0"));
        traded_funds = await rewardContract.getTradedFunds();
        expect(traded_funds.toString()).to.equal(ethers.parseEther("0"));

        //Owner trades the funds
        await expect(
            rewardContract.tradeUserFunds()
        ).to.not.be.reverted;

        //
        lockedBalance = await rewardContract.getLockedBalance(addr2.address);
        expect(lockedBalance.toString()).to.equal(ethers.parseEther("3.0"));
        total_funds = await rewardContract.getTotalFunds();
        expect(total_funds.toString()).to.equal(ethers.parseEther("0"));
        traded_funds = await rewardContract.getTradedFunds();
        expect(traded_funds.toString()).to.equal(ethers.parseEther("3.0"));

        //Owner withdraws the funds
        await expect(
            rewardContract.getETH()
        ).to.not.be.reverted

        await time.increaseTo(endTime);
        await expect(
            rewardContract.connect(addr2).unlock()
        ).to.not.be.reverted;
        
        //
        lockedBalance = await rewardContract.getLockedBalance(addr2.address);
        expect(lockedBalance.toString()).to.equal(ethers.parseEther("0"));
        total_funds = await rewardContract.getTotalFunds();
        expect(total_funds.toString()).to.equal(ethers.parseEther("0"));
        traded_funds = await rewardContract.getTradedFunds();
        expect(traded_funds.toString()).to.equal(ethers.parseEther("0"));

    });

});