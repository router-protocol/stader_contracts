/* eslint-disable camelcase */
/* eslint-disable node/no-missing-import */
// import { expect } from "chai";
import hardhat, { ethers } from "hardhat";
import fs from "fs";
import { getOneInchData } from "../utils";
import { Signer } from "ethers";
import { expect } from "chai";
import { defaultAbiCoder } from "ethers/lib/utils";
import { RPC } from "../../utils/constants";

let owner: Signer;
const NATIVE_ADDR = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const SRC_USDC_ADDR = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const DEST_USDC_ADDR = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const SRC_CHAIN_ID = "137";
const DEST_CHAIN_ID = "1";
const DEST_CHAIN_ID_BYTES= "0x3433313134000000000000000000000000000000000000000000000000000000";

describe("INITIATE TX ON SOURCE TO STAKE ON STADER ON DEST: ", async () => {
    const setupTests = async () => {
  
      const signers = await ethers.getSigners();
      owner = signers[0];

      const MockAssetForwarder = await ethers.getContractFactory("MockAssetForwarder");
      const mockAssetForwarder = await MockAssetForwarder.deploy();

      const DestinationContract = await ethers.getContractFactory("Destination");
      const destContract = await DestinationContract.deploy(mockAssetForwarder.address);

      const SourceContract = await ethers.getContractFactory("Source");
      const sourceContract = await SourceContract.deploy(mockAssetForwarder.address, [DEST_CHAIN_ID_BYTES], [destContract.address]);      

      return {
        mockAssetForwarder,
        sourceContract,
        destContract
      };
    };
  
    beforeEach(async function () {
      await hardhat.network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: RPC["137"],
            },
          },
        ],
      });
    });
  
    it("Can swap MATIC to USDC on OneInch and Call Asset Forwarder", async () => {
      const { mockAssetForwarder, sourceContract, destContract } =
        await setupTests();
  
      const sellAmt = "10000000000000000000";

      
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

      expect(
        await sourceContract.stakeOnStader(
        DEST_CHAIN_ID_BYTES, 
        NATIVE_ADDR, 
        SRC_USDC_ADDR, 
        sellAmt,
        srcBuyAmt,
        await owner.getAddress(),
        srcCalldata,
        destCalldata,
        {
          value: sellAmt,
        }
        )).to.emit(mockAssetForwarder, "FundsDepositedWithMessage");
    });

    it("Should NOT swap MATIC to USDC on OneInch and Call Asset Forwarder if msg value not eq to Amount", async () => {
      const { mockAssetForwarder, sourceContract, destContract } =
        await setupTests();
  
      const sellAmt = "10000000000000000000";

      
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

      await expect(
        sourceContract.stakeOnStader(
        DEST_CHAIN_ID_BYTES, 
        NATIVE_ADDR, 
        SRC_USDC_ADDR, 
        sellAmt,
        srcBuyAmt,
        await owner.getAddress(),
        srcCalldata,
        destCalldata,
        {
          value: "10000000000000000",
        }
        )).to.be.revertedWith("Invalid msg value");
    });

    it("Should NOT Call Asset Forwarder if wrong token is passed to be bridged", async () => {
      const { mockAssetForwarder, sourceContract, destContract } =
        await setupTests();
  
      const sellAmt = "10000000000000000000";

      
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

      await expect(
        sourceContract.stakeOnStader(
        DEST_CHAIN_ID_BYTES, 
        NATIVE_ADDR, 
        DEST_USDC_ADDR, 
        sellAmt,
        srcBuyAmt,
        await owner.getAddress(),
        srcCalldata,
        destCalldata,
        {
          value: sellAmt,
        }
        )).to.be.reverted;
    });

    it("Should NOT Call Asset Forwarder if destination contract is not set for a chain ID", async () => {
      const { mockAssetForwarder, sourceContract, destContract } =
        await setupTests();
  
      const sellAmt = "10000000000000000000";

      
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

      await expect(
        sourceContract.stakeOnStader(
        "0x3433313135000000000000000000000000000000000000000000000000000000", 
        NATIVE_ADDR, 
        DEST_USDC_ADDR, 
        sellAmt,
        srcBuyAmt,
        await owner.getAddress(),
        srcCalldata,
        destCalldata,
        {
          value: sellAmt,
        }
        )).to.be.reverted;
    });
  });

