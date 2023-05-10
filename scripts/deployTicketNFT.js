/*
 * @Author: daibi dbfornewsletter@outlook.com
 * @Date: 2023-04-11 22:36:19
 * @LastEditors: daibi dbfornewsletter@outlook.com
 * @LastEditTime: 2023-05-10 22:53:06
 * @FilePath: /RMRK-demo/scripts/deployTicketNFT.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const { ethers } = require("hardhat");

async function deployTicketNFT(scManagerAddress) {

  const pricePerMint = ethers.utils.parseEther('0.001');
  // Define the constructor arguments
  const initData = {
    erc20TokenAddress: "0x0000000000000000000000000000000000001010",
    tokenUriIsEnumerable: false,
    royaltyRecipient: "0xA0AFCFD57573C211690aA8c43BeFDfC082680D58",
    royaltyPercentageBps: 2,
    maxSupply: 8,
    pricePerMint: pricePerMint
  };

  const accounts = await ethers.getSigners()

  console.log("owner's address: ", await accounts[1].getAddress())


  // Deploy the contract
  const GalleryEventTicket = await ethers.getContractFactory("GalleryEventTicket");
  const galleryEventTicket = await GalleryEventTicket.connect(accounts[1]).deploy(
    initData
  );

  await galleryEventTicket.deployed();

  console.log("owner: ", await galleryEventTicket.owner())

  console.log(`gallery ticket contract deployed to: ${galleryEventTicket.address}`);

  const ConcertEventTicket = await ethers.getContractFactory("ConcertEventTicket");
  const concertEventTicket = await ConcertEventTicket.connect(accounts[1]).deploy(
    initData
  );
  await concertEventTicket.deployed();

  console.log(`concert ticket contract deployed to: ${concertEventTicket.address}`);

  const ButcheryGoodsNFT = await ethers.getContractFactory("ButcheryGoods");
  
  const butcheryPricePerMint = ethers.utils.parseUnits("0", "ether")
  const butcheryInitData = {
    erc20TokenAddress: "0x0000000000000000000000000000000000001010",
    tokenUriIsEnumerable: false,
    royaltyRecipient: "0xA0AFCFD57573C211690aA8c43BeFDfC082680D58",
    royaltyPercentageBps: 2,
    maxSupply: 8,
    pricePerMint: butcheryPricePerMint
  };
  const butcheryGoods = await ButcheryGoodsNFT.connect(accounts[1]).deploy(scManagerAddress, butcheryInitData)

  console.log(`butchery goods contract deployed to: ${butcheryGoods.address}`);

  return {
    galleryEventTicket: galleryEventTicket.address,
    concertEventTicket: concertEventTicket.address,
    butcheryGoods: butcheryGoods.address,
  }
}

// if (require.main === module) {
//     deployTicketNFT()
//       .then(() => process.exit(0))
//       .catch(error => {
//         console.error(error)
//         process.exit(1)
//       })
//   }

exports.deployTicketNFT = deployTicketNFT

