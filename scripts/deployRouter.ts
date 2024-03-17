import {ethers} from "hardhat"

async function main(){
    const [owner] = await ethers.getSigners();

    const factoryAddress = owner.address;
    const addressWETH = owner.address;


    //HARDCODE INIT HASH TO LIBRARY BEFORE DEPLOYMENT
    const RouterContract = await ethers.getContractFactory("XSwapRouter02");
    const router = await RouterContract.deploy(factoryAddress, addressWETH);

    console.log("Router deployed at ", router.target)

    return 0;
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
