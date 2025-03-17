const { ethers } = require("hardhat");

async function main() {
    const [deployer] =  await ethers.getSigners(); 
    console.log("Deploying contracts with the account:", deployer.address);
    const reward_contract = await ethers.getContractFactory("Lab2");
    const rewardContract = await reward_contract.deploy(deployer.address);
    console.log("Lab2 contract deployed to:", rewardContract.target);
} 
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
        console.error(error);
        process.exit(1);
  });
  