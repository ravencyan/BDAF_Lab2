//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RewardToken is ERC20 {
    constructor(address _owner, uint256 initialSupply) ERC20("RewardToken", "RWT") {
        require(_owner != address(0), "Owner address cannot be zero address"); 
        _mint(_owner, initialSupply);
    }
}

contract Lab2 {
    RewardToken reward_token;
    address owner;
    uint256 start_time;
    uint256 end_time;
    uint256 total_supply = 100_000_000 * 10 ** 18;
    uint256 total_funds = 0;
    uint256 traded_funds = 0;

    address[] users;

    mapping(address => uint256) lockedETH; //default 0
    mapping(address => bool) ETHTaken; //default false

    // Events that will be sent onto the blockchain
    event Received(address indexed sender, uint256 amount);
    event StartTimeSet(uint256 startTime);
    event EndTimeSet(uint256 endTime);
    event Locked(address indexed user, uint256 amount);
    event Unlocked(address indexed user, uint256 amount, uint256 reward);
    event FundsTraded(address indexed owner, uint256 amount);
    event FundsWithdrawed(address indexed owner, uint256 amount);

    constructor (address _owner) {
        owner = _owner;
        uint256 initialSupply = 100_000_000 * 10**18;
        reward_token = new RewardToken(address(this), initialSupply); //Cast address to token object
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    modifier ownerOnly {
        require(msg.sender == owner, "You are not the owner of the contract.");
        _;
    }

    function setStartTime(uint256 _start_time) external ownerOnly {
        start_time = _start_time;
        emit StartTimeSet(start_time);
    }

    function setEndTime(uint256 _end_time) external ownerOnly {
        end_time = _end_time;
        emit EndTimeSet(end_time);
    }

    function lock(uint256 amount) external payable {
        require(amount > 0, "Invalid amount");
        require(msg.value == amount, "Sent ETH must match the lock amount");
        require(block.timestamp >= start_time, "Unable to lock before start time");
        require(block.timestamp <= end_time, "Unable to lock after end time");
        lockedETH[msg.sender] = amount;
        total_funds += amount;
        emit Locked(msg.sender, amount);
        users.push(msg.sender);
    }

    function unlock() external {
        uint256 lockedAmount = lockedETH[msg.sender];
        require(lockedAmount > 0, "No locked ETH");
        require(block.timestamp > end_time, "Unable to unlock before end time");
        uint256 reward;
        if (!ETHTaken[msg.sender]) {
            reward = 1000;
            payable(msg.sender).transfer(lockedAmount); //return ETH
            total_funds -= lockedAmount;
        }
        else {
            reward = 1000 + lockedAmount * 2500;
        }
        require(reward_token.balanceOf(address(this)) >= reward, "Insufficient reward token");
        reward_token.transfer(msg.sender, reward); //give reward tokens
        emit Unlocked(msg.sender, lockedAmount, reward);
        lockedETH[msg.sender] = 0;
    }

    // Declared as public so it can also be called within the contract?
    function tradeUserFunds() public ownerOnly {
        require(total_funds > 0, "Insufficient funds to trade");
        uint256 amount = total_funds;
        total_funds -= amount;
        traded_funds += amount;
        for (uint256 i = 0; i < users.length; i++) {
            ETHTaken[users[i]] = true;
        }
        emit FundsTraded(msg.sender, amount);
    }
    
    // Withdraw ALL the traded funds
    function getETH() external ownerOnly {
        //require(amount <= traded_funds, "No enough traded funds to withdraw");
        payable(owner).transfer(traded_funds);
        emit FundsWithdrawed(msg.sender, traded_funds);
        traded_funds = 0;
    }

    function getTotalFunds() external view returns (uint256) {
        return total_funds;
    }

    function getTradedFunds() external view returns (uint256) {
        return traded_funds;
    }

    function getLockedBalance(address user) external view returns (uint256) {
        return lockedETH[user];
    }

}