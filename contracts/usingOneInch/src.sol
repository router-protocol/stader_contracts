// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import  "@openzeppelin/contracts/access/Ownable.sol";

contract Source is Ownable {
    using SafeERC20 for IERC20;

    address public immutable ASSET_FORWARDER_CONTRACT;
    address public constant ONE_INCH =
        0x1111111254EEB25477B68fb85Ed929f73A960582;
    address public constant NATIVE_TOKEN =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    uint256 public constant PARTNER_ID = 0;

    mapping(bytes32 => bytes) public destinationContract;

    // iDepositMessage(uint256,bytes32,bytes,address,uint256,uint256,bytes)
    bytes4 public constant I_DEPOSIT_MESSAGE_SELECTOR =
        bytes4(
            keccak256(
                "iDepositMessage(uint256,bytes32,bytes,address,uint256,uint256,bytes)"
            )
        );

    constructor(
        address _assetForwarder,
        bytes32[] memory destChainIdBytes,
        bytes[] memory destContracts
    ) Ownable(msg.sender) {
        ASSET_FORWARDER_CONTRACT = _assetForwarder;
        setDestinationContracts(destChainIdBytes, destContracts);
    }

    function setDestinationContracts(
        bytes32[] memory destChainIdBytes,
        bytes[] memory destContracts
    ) public onlyOwner {
        require(
            destChainIdBytes.length == destContracts.length,
            "array length mismatch"
        );

        for (uint i = 0; i < destChainIdBytes.length; ) {
            destinationContract[destChainIdBytes[i]] = destContracts[i];
            unchecked {
                ++i;
            }
        }
    }

    function stakeOnStader(
        bytes32 destChainIdBytes,
        address srcToken,
        address destToken,
        uint256 amount,
        uint256 destAmount,
        address userRecipientAddress,
        bytes memory srcSwapData,
        bytes memory destSwapData
    ) public payable {
        uint256 nativeAmount = 0;
        if (srcToken == NATIVE_TOKEN) {
            require(msg.value == amount, "Invalid msg value");
            nativeAmount = amount;
        } else {
            IERC20(srcToken).safeTransferFrom(msg.sender, address(this), amount);
            IERC20(srcToken).safeIncreaseAllowance(address(ONE_INCH), amount);
        }

        if (srcSwapData.length != 0) {
            (bool success, ) = ONE_INCH.call{value: nativeAmount}(srcSwapData);
            if (!success) revert("1Inch-swap-failed");
        }

        uint256 amountToBridge = IERC20(destToken).balanceOf(address(this));
        require(amountToBridge > 0, "bridge amount is zero");

        _callAssetForwarder(
            destChainIdBytes,
            destToken,
            amountToBridge,
            destAmount,
            userRecipientAddress,
            destSwapData
        );
    }

    function _callAssetForwarder(
        bytes32 destChainIdBytes,
        address srcToken,
        uint256 amount,
        uint256 destAmount,
        address userRecipientAddress,
        bytes memory destSwapData
    ) internal {
        IERC20(srcToken).safeIncreaseAllowance(ASSET_FORWARDER_CONTRACT, amount);

        bytes memory message = abi.encode(userRecipientAddress, destSwapData);
        (bool success, ) = ASSET_FORWARDER_CONTRACT.call(
            abi.encodeWithSelector(
                I_DEPOSIT_MESSAGE_SELECTOR,
                PARTNER_ID,
                destChainIdBytes,
                destinationContract[destChainIdBytes],
                srcToken,
                amount,
                destAmount,
                message
            )
        );

        require(success, "assetForwarder deposit failed");
    }
}