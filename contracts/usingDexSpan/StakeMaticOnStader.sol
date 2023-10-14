// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../SafeMath.sol";
import "../interfaces/IStaderPool.sol";
import "hardhat/console.sol";

contract StakeMaticOnStader {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public immutable dexSpan;
    address public constant MATIC = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public constant MATICx = 0xfa68FB4628DFF1028CFEc22b4162FCcd0d45efb6;
    IStaderPool public constant STADER_POOL = IStaderPool(0xfd225C9e6601C9d38d8F98d8731BF59eFcF8C0E3);

    event MATICxReceived(address _receiver, uint256 returnAmount);

    constructor (address _dexSpan) {
        dexSpan = _dexSpan;
    }

    function handleMessage(
        address tokenSent,
        uint256 amount,
        bytes memory message
    ) external {
        // Checking if the sender is the dexSpan contract
        require(msg.sender == dexSpan, "only dexspan");

        address user = abi.decode(message, (address));

        _callStaderPool(user, amount);
    }

    function _callStaderPool (address _receiver, uint256 amount) internal {
        uint256 initialBalMATICx = IERC20(MATICx).balanceOf(address(this));

        STADER_POOL.swapMaticForMaticXViaInstantPool{value : amount}();

        uint256 receivedMATICx = IERC20(MATICx).balanceOf(address(this)).sub(initialBalMATICx);

        console.log("MATICx received by contract: %s", receivedMATICx);

        require(receivedMATICx != 0 , "STADER FAILED");

        IERC20(MATICx).safeTransfer(_receiver, receivedMATICx);

        console.log("MATICx received by receiver: %s", IERC20(MATICx).balanceOf(_receiver));

        emit MATICxReceived(_receiver, receivedMATICx);
    }

    receive() external payable{}
}