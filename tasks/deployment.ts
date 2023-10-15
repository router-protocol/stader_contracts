import { HardhatUserConfig, task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("deploystaker").setAction(async function (
  taskArguments: TaskArguments,
  hre
) {
    console.log("Deploying Staker Contract....")
  const dexSpanAddress = "0xb3af8279766552e1fAcD0647971cDAFaaA409912";
  const stakerContract = await hre.ethers.getContractFactory(
    "StaderMaticStaker"
  );
  const staker = await stakerContract.deploy();
  await staker.deployed();
  console.log("Staker deployed on",staker.address)
});
