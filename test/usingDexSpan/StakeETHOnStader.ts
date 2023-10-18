import hardhat, { ethers } from "hardhat";
import { Signer } from "ethers";
import { assert, expect } from "chai";
import { defaultAbiCoder } from "ethers/lib/utils";
import { RPC } from "../../utils/constants";

let owner: Signer;
const NATIVE_ADDR = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const CHAIN_ID = "1";

describe("STAKE ETH ON STADER: ", async () => {
    const setupTests = async () => {

      const signers = await ethers.getSigners();
      owner = signers[0];
      
      const StakeOnStaderContract = await ethers.getContractFactory("StaderEthStaker");
      const stakeOnStader = await StakeOnStaderContract.deploy();

      return {
        stakeOnStader,
      };
    };

    beforeEach(async function () {
      await hardhat.network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: RPC["1"],
            },
          },
        ],
      });
    });
  
    it("Can stake ETH on STADER POOL", async () => {
      const {stakeOnStader} =
      await setupTests();

      const ownerAddress = await owner.getAddress();

      const tx = {
        from: ownerAddress,
        to : stakeOnStader.address,
        value: ethers.utils.parseUnits("1", "ether"),
      }

      await owner.sendTransaction(tx);
      
      const nativeAmount = "1000000000000000000";

      const message = defaultAbiCoder.encode(["address"], [ownerAddress]);

      expect(
        await stakeOnStader.handleMessage(
        NATIVE_ADDR,
        nativeAmount,
        message,
        )).to.emit(stakeOnStader, "EthXReceived");
    });
});