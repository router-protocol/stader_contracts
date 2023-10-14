// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../SafeMath.sol";
import "../interfaces/IStaderPool.sol";

contract Destination {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public immutable assetforwarderContract;
    address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public constant ONE_INCH = 0x1111111254EEB25477B68fb85Ed929f73A960582;
    address public constant ETHX = 0xA35b1B31Ce002FBF2058D22F30f95D405200A15b;
    IStaderPool public constant STADER_POOL = IStaderPool(0xcf5EA1b38380f6aF39068375516Daf40Ed70D299);

    event EthXReceived(address _receiver, uint256 returnAmount);

    constructor (address _assetForwarderContract) {
        assetforwarderContract = _assetForwarderContract;
    }

    function handleMessage(
        address tokenSent,
        uint256 amount,
        bytes memory message
    ) external {
        // Checking if the sender is the assetForwarderContract contract
        require(msg.sender == assetforwarderContract, "only assetForwarderContract");

        uint256 ethAmount;

        address user;

        if (tokenSent == ETH) {          
            ethAmount = amount;  
            user = abi.decode(message, (address));
        } else {
            bytes memory destSwapData;
            (user, destSwapData) = abi.decode(message, (address, bytes));
            ethAmount = _swapOneInch(tokenSent, amount, destSwapData);
        }

        _callStaderPool(user, ethAmount);
    }

    function _swapOneInch(address token, uint256 amount, bytes memory destSwapData) internal returns (uint256) {
        IERC20(token).safeIncreaseAllowance(
            ONE_INCH,
            amount
            );

        uint256 initialBal = address(this).balance;
        (bool success, ) = ONE_INCH.call(destSwapData); 
        if (!success) revert("1Inch-swap-failed");

        uint256 finalBal = address(this).balance;

        return finalBal.sub(initialBal);
    }

    function _callStaderPool (address _receiver, uint256 amount) internal {
        uint256 initialBalETHx = IERC20(ETHX).balanceOf(_receiver);

        STADER_POOL.deposit{value : amount}(_receiver);

        uint256 receivedETHx = IERC20(ETHX).balanceOf(_receiver).sub(initialBalETHx);

        require(receivedETHx != 0 , "STADER FAILED");

        emit EthXReceived(_receiver, receivedETHx);
    }

    receive() external payable{}
}