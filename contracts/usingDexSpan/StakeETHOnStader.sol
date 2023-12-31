// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../SafeMath.sol";
import "../interfaces/IStaderPool.sol";

contract StaderEthStaker {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public constant ETHX = 0xA35b1B31Ce002FBF2058D22F30f95D405200A15b;
    IStaderPool public constant STADER_POOL = IStaderPool(0xcf5EA1b38380f6aF39068375516Daf40Ed70D299);

    event EthXReceived(address _receiver, uint256 returnAmount);

    function handleInstruction(
        address tokenSent,
        uint256 amount,
        bytes memory instruction
    ) external {
        require(amount > 0, "not enough amount to stake");
        
        address user = abi.decode(instruction, (address));
        _stakeStaderPool(user, amount);
    }

    function handleMessage(
        address tokenSent,
        uint256 amount,
        bytes memory instruction
    ) external {
        require(amount > 0, "not enough amount to stake");

        address user = abi.decode(instruction, (address));

        _stakeStaderPool(user, amount);
    }

    function _stakeStaderPool (address _receiver, uint256 amount) internal {
        uint256 initialBalETHx = IERC20(ETHX).balanceOf(_receiver);

        STADER_POOL.deposit{value : amount}(_receiver);

        uint256 receivedETHx = IERC20(ETHX).balanceOf(_receiver).sub(initialBalETHx);

        require(receivedETHx != 0 , "STADER FAILED");

        emit EthXReceived(_receiver, receivedETHx);
    }

    receive() external payable{}
}