const { ethers } = require("hardhat");

async function main() {
    const ONE_WEI = ethers.parseUnits("1", "wei");

    const [owner] = await ethers.getSigners();
    const alice = owner; //Since only have one account
    const bob = owner;
    const contractAddress = "0xDc9c5eF4e351Fb444a24294EF2E59cCc6a8627B5";
    const reward_contract = await ethers.getContractFactory("Lab2");
    const rewardContract = await reward_contract.attach(contractAddress);

    async function setTimes(startOffset, endOffset) {
        const startTime = Math.floor(Date.now() / 1000) + startOffset;
        const endTime = startTime + endOffset;
        let tx = await rewardContract.connect(owner).setStartTime(startTime);
        await tx.wait();
        console.log("Start time set to:", startTime);
        tx = await rewardContract.connect(owner).setEndTime(endTime);
        await tx.wait();
        console.log("End time set to:", endTime);
        return { startTime, endTime };
    }

    await setTimes(10, 120);
    //Wait 10 seconds for start time to arrive
    console.log("Waiting for start time...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    //Alice locks ETH
    tx = await rewardContract.connect(alice).lock(ONE_WEI, {value: ONE_WEI});
    await tx.wait();
    console.log("Alice locked ETH, Tx hash:", tx.hash);

    //Wait for end time (120 seconds)
    console.log("Waiting for end time...");
    await new Promise((resolve) => setTimeout(resolve, 120000));

    //Alice unlocks ETH
    tx = await rewardContract.connect(alice).unlock();
    await tx.wait();
    console.log("Alice unlocked ETH, Tx hash:", tx.hash);

    await setTimes(10, 120);
    //Wait 10 seconds for start time to arrive
    console.log("Waiting for start time...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
    
    //Bob locks ETH
    tx = await rewardContract.connect(bob).lock(ONE_WEI, {value: ONE_WEI});
    await tx.wait();
    console.log("Bob locked ETH, Tx hash:", tx.hash);

    //Owner trades the funds
    tx = await rewardContract.connect(owner).tradeUserFunds();
    await tx.wait();
    console.log("Owner traded Bob's funds, Tx hash:", tx.hash);

    //Owner withdraws the funds
    tx = await rewardContract.connect(owner).getETH();
    await tx.wait();
    console.log("Owner withrawed traded funds, Tx hash:", tx.hash);

    //Wait for end time (120 seconds)
    console.log("Waiting for end time...");
    await new Promise((resolve) => setTimeout(resolve, 120000));

    //Bob unlocks ETH
    tx = await rewardContract.connect(bob).unlock();
    await tx.wait();
    console.log("Bob unlocked ETH, Tx hash:", tx.hash);
} 
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
        console.error(error);
        process.exit(1);
  });