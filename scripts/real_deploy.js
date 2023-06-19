/* global ethers */
/* eslint prefer-const: "off" */

const { ethers } = require('hardhat')
const { deployAuthenticSCManager } = require('./deployAuthenticSC.js') 
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')
const { deployPropagationRecorder } = require('./deployPropagationRecorder.js')

async function deployDiamond() {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]
  const contractOwnerAddress = await contractOwner.getAddress()

  // deploy authentic smart contract
  const scManagerAddress = await deployAuthenticSCManager();
  console.log('authenticate sc manager deployed: ', scManagerAddress)

  // deploy propagation recorder
  const propagationRecorderAddress = await deployPropagationRecorder()
  console.log('propagationRecorder deployed: ', propagationRecorderAddress)


  // Deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded or deployed to initialize state variables
  // Read about how the diamondCut function works in the EIP2535 Diamonds standard
  const DiamondInit = await ethers.getContractFactory('DiamondInit')
  const diamondInit = await DiamondInit.deploy()
  await diamondInit.deployed()
  console.log('DiamondInit deployed:', diamondInit.address)

  // Deploy facets and set the `facetCuts` variable
  console.log('Deploying facets')
  const FacetNames = [
    'DiamondCutFacet',
    'DiamondLoupeFacet',
    'OwnershipFacet'
  ]
  // The `facetCuts` variable is the FacetCut[] that contains the functions to add during diamond deployment
  const facetCuts = []
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName)
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${facet.address}`)
    facetCuts.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  // Creating a function call
  // This call gets executed during deployment and can also be executed in upgrades
  // It is executed with delegatecall on the DiamondInit address.
  let functionCall = diamondInit.interface.encodeFunctionData('init')

  // Setting arguments that will be used in the diamond constructor
  const diamondArgs = {
    owner: contractOwner.address,
    init: diamondInit.address,
    initCalldata: functionCall
  }

  // deploy Diamond
  const Diamond = await ethers.getContractFactory('Diamond')
  const diamond = await Diamond.deploy(facetCuts, diamondArgs)
  await diamond.deployed()
  console.log()
  console.log('Diamond deployed:', diamond.address)

  let diamondAddress = diamond.address
  let diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
  let diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)

  // deploying baseInfo facet
  console.log("start to deploy Base info facet")
  const BaseInfoFacet = await ethers.getContractFactory('BaseInfoFacet')
  let baseInfoFacet = await BaseInfoFacet.deploy()
  await baseInfoFacet.deployed()

  const BaseInfoInit = await ethers.getContractFactory('RMRKNestableFacetInit')
  let baseInfoInit = await BaseInfoInit.deploy()
  await baseInfoInit.deployed()

  const baseInfoSelectors = getSelectors(baseInfoFacet)
  let baseInfoCalldata = baseInfoInit.interface.encodeFunctionData('init', ['NAIN NFT', 'NAIN', scManagerAddress, propagationRecorderAddress])
  tx = await diamondCutFacet.diamondCut(
    [{
      facetAddress: baseInfoFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: baseInfoSelectors
    }],
    baseInfoInit.address, baseInfoCalldata, { gasLimit: 800000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('deployed base info facet')

  // deploying collection meta info facet
  console.log('start to deploy collection meta info facet')

  const CollectionMetaFacet = await ethers.getContractFactory("CollectionMetaFacet")
  let collectionMetaFacet = await CollectionMetaFacet.deploy()
  await collectionMetaFacet.deployed()

  const CollectionMetaFacetInit = await ethers.getContractFactory("CollectionMetaFacetInit")
  let collectionMetaFacetInit = await CollectionMetaFacetInit.deploy()
  await collectionMetaFacetInit.deployed()

  const collectionMetaFacetSelectors = getSelectors(collectionMetaFacet)
  let collectionMetaCalldata = collectionMetaFacetInit.interface.encodeFunctionData('init', ['https://project-oracle-test.mypinata.cloud/ipfs/bafkreidbr7q2hxxsviaks6jrgz4aaicek5ylv5otwdq3v4u2l5op6yc4sq', 'https://project-oracle-test.mypinata.cloud/ipfs/QmWUhDtzYcyqovbkefa2oR19fnB4MTk2AC8W6xkY1EBoRv/'])
  tx = await diamondCutFacet.diamondCut(
    [{
      facetAddress: collectionMetaFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: collectionMetaFacetSelectors
    }],
    collectionMetaFacetInit.address, collectionMetaCalldata, { gasLimit: 800000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('deployed collection metadata facet')

  // deploying RMRK mint & burn facet
  console.log('deploying RMRK mint & burn facet')
  const MintAndBurnFacet = await ethers.getContractFactory("RMRKMintAndBurnFacet")
  const mintAndBurnFacet = await MintAndBurnFacet.deploy()
  await mintAndBurnFacet.deployed()

  const MintAndBurnInit = await ethers.getContractFactory("MintAndBurnFacetInit")
  let mintAndBurnInit = await MintAndBurnInit.deploy()
  await mintAndBurnInit.deployed()

  const mintAndBurnFacetSelectors = getSelectors(mintAndBurnFacet)
  let pricePerMint = ethers.utils.parseUnits("0.01", "ether")
  let mintAndBurnCalldata = mintAndBurnInit.interface.encodeFunctionData('init', [16, pricePerMint])
  tx = await diamondCutFacet.diamondCut(
    [{
      facetAddress: mintAndBurnFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: mintAndBurnFacetSelectors
    }],
    mintAndBurnInit.address, mintAndBurnCalldata, { gasLimit: 800000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('deployed RMRK mint & burn facet')

  // deploy RMRK nestable facet
  console.log('deploying RMRK nestable facet')
  const RMRKNestableFacet = await ethers.getContractFactory("RMRKNestableFacet")
  const rmrkNestableFacet = await RMRKNestableFacet.deploy()
  await rmrkNestableFacet.deployed()

  const rmrkNestableFacetSelectors = getSelectors(rmrkNestableFacet)
  tx = await diamondCutFacet.diamondCut(
    [{
      facetAddress: rmrkNestableFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: rmrkNestableFacetSelectors
    }],
    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('deployed RMRK nestable facet!')

  // deploy RMRK transfer facet
  console.log('deploying RMRK transfer facet...')
  const RMRKTransferFacet = await ethers.getContractFactory('RMRKTransferFacet')
  const rmrkTransferFacet = await RMRKTransferFacet.deploy()
  await rmrkTransferFacet.deployed()

  const rmrkTransferFacetSelectors = getSelectors(rmrkTransferFacet)
  tx = await diamondCutFacet.diamondCut(
    [{
      facetAddress: rmrkTransferFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: rmrkTransferFacetSelectors
    }],
    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('deployed RMRK transfer facet!')

  // deploy Royalty info facet
  console.log('deploying RMRK royalty info facet...')
  const RoyaltyInfoFacet = await ethers.getContractFactory('RoyaltyInfoFacet')
  const royaltyInfoFacet = await RoyaltyInfoFacet.deploy()
  await royaltyInfoFacet.deployed()

  const RoyaltyFacetInit = await ethers.getContractFactory("RoyaltyInfoFacetInit")
  let royaltyFacetInit = await RoyaltyFacetInit.deploy()
  await royaltyFacetInit.deployed()

  const royaltyInfoFacetSelectors = getSelectors(royaltyInfoFacet)
  let royaltyInfoInitCallData = royaltyFacetInit.interface.encodeFunctionData('init', [contractOwnerAddress, 2])
  tx = await diamondCutFacet.diamondCut(
    [{
      facetAddress: royaltyInfoFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: royaltyInfoFacetSelectors
    }],
    royaltyFacetInit.address, royaltyInfoInitCallData, { gasLimit: 800000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('deployed RMRK royalty info facet!')

  // deploy whitelist facet
  console.log("deploying whitelist facet...")
  const WhitelistFacet = await ethers.getContractFactory("WhitelistFacet")
  const whitelistFacet = await WhitelistFacet.deploy()
  await whitelistFacet.deployed()

  const whitelistFacetSelectors = getSelectors(whitelistFacet)
  tx = await diamondCutFacet.diamondCut(
    [{
      facetAddress: whitelistFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: whitelistFacetSelectors
    }],
    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('deployed whitelist facet!')

  let subNFTPricePerMint = ethers.utils.parseEther('0.001');
  // Define the constructor arguments
  const initData = {
    erc20TokenAddress: "0x0000000000000000000000000000000000001010",
    tokenUriIsEnumerable: false,
    royaltyRecipient: "0xA0AFCFD57573C211690aA8c43BeFDfC082680D58",
    royaltyPercentageBps: 2,
    maxSupply: 8,
    pricePerMint: subNFTPricePerMint
  };

  // Deploy the contract
  const GalleryEventTicket = await ethers.getContractFactory("GalleryEventTicket");
  const galleryEventTicket = await GalleryEventTicket.deploy(
    initData
  );

  await galleryEventTicket.deployed();

  console.log(`gallery ticket contract deployed to: ${galleryEventTicket.address}`);

  const ConcertEventTicket = await ethers.getContractFactory("ConcertEventTicket");
  const concertEventTicket = await ConcertEventTicket.deploy(
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
  const butcheryGoods = await ButcheryGoodsNFT.deploy(scManagerAddress, butcheryInitData)

  console.log(`butchery goods contract deployed to: ${butcheryGoods.address}`);

  // returning the address of the diamond
  return {scManagerAddress, diamondAddress}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployDiamond = deployDiamond