// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockAssetForwarder {
    using SafeERC20 for IERC20;

    bytes4 public constant HANDLE_MESSAGE_SELECTOR =
        bytes4(
            keccak256(
                "handleMessage(address,uint256,bytes)"
            )
        );

    event FundsDepositedWithMessage(
        uint256 partnerId,
        bytes32 destChainIdBytes,
        bytes recipient,
        address srcToken,
        uint256 amount,
        uint256 destAmount,
        bytes message
    );

    address public destinationContract;

    function setDestinationContract(address _destinationContract) external {
        destinationContract = _destinationContract;
    }

    function iDepositMessage(
        uint256 partnerId,
        bytes32 destChainIdBytes,
        bytes calldata recipient,
        address srcToken,
        uint256 amount,
        uint256 destAmount,
        bytes memory message
    ) external payable {
        if (msg.value == 0) {
            IERC20(srcToken).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
        } else {
            amount = msg.value;
        }

        emit FundsDepositedWithMessage(
            partnerId,
            destChainIdBytes,
            recipient,
            srcToken,
            amount,
            destAmount,
            message
        );
    }

    function iRelayMessage(
        address destToken,
        uint256 amount,
        bytes calldata message
    ) external {
        require(
            IERC20(destToken).balanceOf(msg.sender) >= amount,
            "Insufficient balance in forwarder account"
        );

        IERC20(destToken).safeTransferFrom(
            msg.sender,
            destinationContract,
            amount
        );

        // handleMessage
        (bool success, ) = destinationContract.call(
            abi.encodeWithSelector(HANDLE_MESSAGE_SELECTOR, destToken, amount, message)
        );
        require(success, "asset forwarder call unsuccessful");
    }
}