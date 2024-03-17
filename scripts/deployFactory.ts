import { ethers } from "hardhat";


async function main(){
    const [owner] = await ethers.getSigners();

    const FactoryContract = await ethers.getContractFactory("XSwapFactory");
    const factory = await FactoryContract.deploy(owner.address);

    console.log("Factory deployed at ", factory.target);
    console.log("Init hash ", await factory.INIT_CODE_PAIR_HASH(), "\nInsert init hash to library before deployment Router");
    
    await factory.connect(owner).setFeeTo(owner.address);

    console.log("Fee goes to", owner.address);

    return 0;
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });


