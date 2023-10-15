// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../SafeMath.sol";
import "../interfaces/IStaderPool.sol";


contract StaderMaticStaker {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;


    address public constant MATIC = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public constant MATICx = 0xfa68FB4628DFF1028CFEc22b4162FCcd0d45efb6;
    IStaderPool public constant STADER_POOL = IStaderPool(0xfd225C9e6601C9d38d8F98d8731BF59eFcF8C0E3);

    event MATICxReceived(address _receiver, uint256 returnAmount);

    function handleInstruction(
        address tokenSent,
        uint256 amount,
        bytes memory instruction
    ) external {
        address user = abi.decode(instruction, (address));
        _stakeStaderPool(user, amount);
    }

    function _stakeStaderPool (address _receiver, uint256 amount) internal {
        STADER_POOL.swapMaticForMaticXViaInstantPool{value : amount}();
        uint receivedMATICx = IERC20(MATICx).balanceOf(address(this));
        IERC20(MATICx).safeTransfer(_receiver, receivedMATICx);
        emit MATICxReceived(_receiver, receivedMATICx);
    }

    receive() external payable{}
}