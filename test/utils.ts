/* eslint-disable node/no-extraneous-import */
import BigNumber from "bignumber.js";
import axios from "axios";
import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();


export const getOneInchData = async (
  chainId: string,
  sellToken: string,
  buyToken: string,
  sellAmt: string,
  from: string,
  slippage: number = 1
) => {
  const ONE_INCH_API_KEY = process.env.ONE_INCH_API_KEY;
  if(!ONE_INCH_API_KEY) throw new Error("Please add ONE_INCH_API_KEY in .env");
  const ONE_INCH_API = `https://api-router.1inch.io/v5.2/${chainId}/swap?fromTokenAddress=${sellToken}&toTokenAddress=${buyToken}&amount=${sellAmt}&fromAddress=${from}&slippage=${slippage}&disableEstimate=true`
  const OneInchData = await axios.get(
    //`https://api.1inch.dev/swap/v5.2/${chainId}/swap?src=${sellToken}&dst=${buyToken}&amount=${sellAmt}&from=${from}&slippage=${slippage}&disableEstimate=true`,
    ONE_INCH_API,
    {
      headers: {
        Authorization: `Bearer ${ONE_INCH_API_KEY}`,
        Accept: "application/json",
      },
    }
  );

  console.log("Got one inch data from the api");
  const buyAmt = OneInchData.data.toAmount;
  const calldata = OneInchData.data.tx.data;

  return [buyAmt, calldata];
};