import { AddressLike, Addressable, Contract } from "ethers";
import { ethers } from "hardhat";
import {Signer, Wallet} from "ethers";
import { XSwapFactory } from "../typechain-types";
import { XSwapRouter02 } from "../typechain-types"; 
import { XSwapPair } from "../typechain-types"; 
import {expect} from "chai";


const hre = require("hardhat");

async function createPair(factoryContract : XSwapFactory, token0Address : string, token1Address : string){

    await factoryContract.createPair(token0Address, token1Address);

    const pairAddress = await factoryContract.getPair(token0Address, token1Address);
    // console.log("PAIR ADDRESS", pairAddress);
    const PairContract = await ethers.getContractFactory("XSwapPair");
    const pair = PairContract.attach(pairAddress);

    return pair;
}


describe("Fee accruals", function () {
    it("Fee must go to owner", async function () {
        //------DEPLOY------\\
        const [owner, user, swapper, anotherLiquidity] = await ethers.getSigners();
        
        // console.log("BALANCE = ", )
        // console.log("ADDRESS owner", owner);

        const DAI = await ethers.deployContract("ERC20", [ethers.parseEther("100000")])
        await DAI.waitForDeployment();

        // console.log("DAI DEPLOYED AT", DAI.target);

        const WETH9 = await ethers.deployContract("WETH9")
        await WETH9.waitForDeployment();

        // console.log("WETH DEPLOYED AT", WETH9.target);

        const FactoryContract = await hre.ethers.getContractFactory("XSwapFactory");
        const factoryContract = await FactoryContract.deploy(owner.address) as XSwapFactory;
        await factoryContract.setFeeTo(owner);
        // console.log("INIT HASH", await factoryContract.INIT_CODE_PAIR_HASH())
        // console.log("ADDRESS FACTORY", factoryContract.target);

        const RouterContract = await ethers.getContractFactory("XSwapRouter02");
        const routerContract = await RouterContract.deploy(factoryContract.target, WETH9.target) as XSwapRouter02;


        // console.log("ADDRESS ROUTER", routerContract.target);
        const pair = await createPair(factoryContract as XSwapFactory, DAI.target as string, WETH9.target as string) as XSwapPair;

        // console.log("PAIR ADDRESS AFTER FUNCTION", pair.target);
        // console.log("INIT CODE", await factoryContract.INIT_CODE_PAIR_HASH());


        //------ADD LIQUIDITY------\\
        await WETH9.deposit({from : owner, value : ethers.parseEther("10")});

        let tx1 = await DAI.approve(routerContract.target, await DAI.balanceOf(owner.address),{from : owner.address});
        let tx2 = await WETH9.approve(routerContract.target, await WETH9.balanceOf(owner),{from : owner});
        
        tx1.wait();
        tx2.wait();
        // console.log(await routerContract.addLiquidity(WETH9.target, DAI.target, await WETH9.balanceOf(owner.address), await DAI.balanceOf(owner.address), 0, 0, owner, Date.now() + 100, {from : owner}));
        
        let addLiquidityTx = await routerContract.connect(owner).addLiquidity(WETH9.target, DAI.target, await WETH9.balanceOf(owner.address), await DAI.balanceOf(owner.address), 0, 0, owner, Date.now() + 1000, {from : owner});
        addLiquidityTx.wait();
        // console.log("RESERVES", (await pair.getReserves()));

        //------ADD LIQUIDITY------\\

        await WETH9.connect(anotherLiquidity).deposit({value : ethers.parseEther("10")});
        await DAI.connect(anotherLiquidity).mint(ethers.parseEther("100000"))

        // console.log("WETH BALANCE ANOTHER", await WETH9.balanceOf(anotherLiquidity));
        // console.log("DAI BALANCE ANOTHER", await DAI.balanceOf(anotherLiquidity))

        tx1 = await DAI.connect(anotherLiquidity).approve(routerContract.target, await DAI.balanceOf(anotherLiquidity.address));
        tx2 = await WETH9.connect(anotherLiquidity).approve(routerContract.target, await WETH9.balanceOf(anotherLiquidity.address));

        addLiquidityTx = await routerContract.connect(anotherLiquidity).addLiquidity(WETH9.target, DAI.target, await WETH9.balanceOf(anotherLiquidity.address), await DAI.balanceOf(anotherLiquidity.address), 0, 0, anotherLiquidity, Date.now() + 1000);
        addLiquidityTx.wait();



        //------SWAPS------\\
        let path = [DAI, WETH9];
        await DAI.connect(swapper).mint(ethers.parseEther("10000"))
        for (let i = 0; i < 40; i++){
            let path_ = [path[0].target, path[1].target];

            let approve = path[0].connect(swapper).approve(routerContract.target, await path[0].balanceOf(swapper));
            (await approve).wait();

            let swapTx = await routerContract.connect(swapper).swapExactTokensForTokens(await path[0].balanceOf(swapper), 0, path_, swapper.address, Date.now() + 1000);
            swapTx.wait();
            path.reverse();
        }



        //------ADD MORE LIQUIDITY------\\
        await WETH9.connect(user).deposit({value : ethers.parseEther("10")});
        await DAI.connect(user).mint(ethers.parseEther("100000"))


        tx1 = await DAI.connect(user).approve(routerContract.target, await DAI.balanceOf(user.address));
        tx2 = await WETH9.connect(user).approve(routerContract.target, await WETH9.balanceOf(user.address));

        tx1.wait();
        tx2.wait();

        // console.log("BALANCE LP OWNER BEFORE", await pair.balanceOf(owner));
        let balanceLpBefore = await pair.balanceOf(owner);
        // console.log("BALANCE LP ANOTHER BEFORE", await pair.balanceOf(anotherLiquidity))
        addLiquidityTx = await routerContract.connect(user).addLiquidity(WETH9.target, DAI.target, await WETH9.balanceOf(user.address), await DAI.balanceOf(user.address), 0, 0, user, Date.now() + 1000);
        addLiquidityTx.wait();

        let balanceLpAfter = await pair.balanceOf(owner);
        // console.log("BALANCE LP OWNER AFTER", await pair.balanceOf(owner));
        expect(balanceLpBefore).to.be.lt(balanceLpAfter)

        // console.log("Balance ETH before", await WETH9.balanceOf(anotherLiquidity));
        // console.log("Balance DAI before", await DAI.balanceOf(anotherLiquidity));

        // await pair.connect(anotherLiquidity).approve(routerContract.target, await pair.balanceOf(anotherLiquidity));
        // await routerContract.connect(anotherLiquidity).removeLiquidity(WETH9.target, DAI.target, await pair.balanceOf(anotherLiquidity), 0, 0, anotherLiquidity.address, Date.now() + 1000);

        // console.log("Balance LP after", await pair.balanceOf(anotherLiquidity));
        // console.log("Balance ETH after", await WETH9.balanceOf(anotherLiquidity));
        // console.log("Balance DAI after", await DAI.balanceOf(anotherLiquidity));

    });
  });


