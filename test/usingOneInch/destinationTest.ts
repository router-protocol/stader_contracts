import hardhat, { ethers } from "hardhat";
import { getOneInchData } from "../utils";
import { Signer } from "ethers";
import { assert, expect } from "chai";
import { defaultAbiCoder } from "ethers/lib/utils";
import { RPC } from "../../utils/constants";

let owner: Signer;
const NATIVE_ADDR = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const SRC_USDC_ADDR = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const DEST_USDC_ADDR = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const ONE_INCH_ADDR = "0x1111111254EEB25477B68fb85Ed929f73A960582";
const SRC_CHAIN_ID = "137";
const DEST_CHAIN_ID = "1";
const DEST_CHAIN_ID_BYTES= "0x3433313134000000000000000000000000000000000000000000000000000000";

describe("STAKE ETH ON STADER VIA ASSET FORWARDER: ", async () => {
    const setupTests = async () => {
  
      const connection = new ethers.providers.JsonRpcProvider(`${RPC["1"]}`);

      const signers = await ethers.getSigners();
      owner = signers[0];

      const MockAssetForwarder = await ethers.getContractFactory("MockAssetForwarder");
      const mockAssetForwarder = await MockAssetForwarder.deploy();
      
      const DestinationContract = await ethers.getContractFactory("Destination");
      const destContract = await DestinationContract.deploy(mockAssetForwarder.address);
      
      await mockAssetForwarder.setDestinationContract(destContract.address);

      const SourceContract = await ethers.getContractFactory("Source");
      const sourceContract = await SourceContract.deploy(mockAssetForwarder.address, [DEST_CHAIN_ID_BYTES], [destContract.address]);    
      
      const USDC = await ethers.getContractFactory("MockToken");
      const usdc = await USDC.attach(DEST_USDC_ADDR);

      return {
        connection,
        mockAssetForwarder,
        sourceContract,
        destContract,
        usdc
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
  
    it("Can swap USDC to ETH on OneInch and Call STADER POOL", async () => {
      const { mockAssetForwarder, sourceContract, destContract, usdc } =
        await setupTests();
      
        const ownerAddress = await owner.getAddress();

      const [BuyAmt, Calldata] = await getOneInchData(
        DEST_CHAIN_ID,
        NATIVE_ADDR,
        DEST_USDC_ADDR,
        "1000000000000000000",
        ownerAddress,
        );

      const tx = {
        from: ownerAddress,
        to : ONE_INCH_ADDR,
        value: ethers.utils.parseUnits("1", "ether"),
        data: Calldata,
      }

      const transaction = await owner.sendTransaction(tx);

      const balanceUSDC = await usdc.balanceOf(ownerAddress);
      console.log("BALANCE USDC: ", balanceUSDC.toString());
      expect(balanceUSDC).gt(0);

      
      const sellAmt = "1000000000000000000";
      
      
      const [srcBuyAmt, srcCalldata] = await getOneInchData(
        SRC_CHAIN_ID,
        NATIVE_ADDR,
        SRC_USDC_ADDR,
        sellAmt,
        sourceContract.address
        );
        
      const [destBuyAmt, destCalldata] = await getOneInchData(
        DEST_CHAIN_ID,
        DEST_USDC_ADDR,
        NATIVE_ADDR,
        srcBuyAmt,
        destContract.address
        );
        
      console.log("SRC_BUY_AMT", srcBuyAmt);
      console.log("DEST_BUY_AMT", destBuyAmt);
      
      await usdc.approve(mockAssetForwarder.address, srcBuyAmt);

      const message = defaultAbiCoder.encode(["address", "bytes"], [ownerAddress, destCalldata]);

      console.log("USDC APPROVAL GIVEN");

      expect(
        await mockAssetForwarder.iRelayMessage(
        DEST_USDC_ADDR,
        srcBuyAmt,
        message,
        )).to.emit(destContract, "EthXReceived");
    });
});