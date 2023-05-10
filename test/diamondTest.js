/* global describe it before ethers */

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

const { deployDiamond } = require('../scripts/deploy.js')
const { deployTicketNFT } = require('../scripts/deployTicketNFT.js')

const { assert, expect } = require('chai')
const { ethers, waffle } = require('hardhat')
const { time } = require('@nomicfoundation/hardhat-network-helpers')

let sleep= (time)=> new Promise((resolve)=>{
  setTimeout(resolve,time)
})


describe('DiamondTest', async function () {

  // authentic smart contract 
  // diamond facets
  let diamondAddress
  let authenticateSCManagerAddress
  let authenticateSCManager
  let propagationRecorderAddress
  let propagationRecorder
  let diamondCutFacet
  let diamondLoupeFacet
  let ownershipFacet
  let tx
  let receipt
  let result
  const addresses = []
  let baseInfoFacet
  let collectionMetaFacet
  let royaltyInfoFacet
  let mintAndBurnFacet
  let rmrkNestableFacet
  let whitelistFacet
  
  // libraries
  let libERC721
  let libRMRKNestable

  // tickets demo
  let galleryEventTicketAddress;
  let galleryEventTicket;
  let concertEventTicketAddress;
  let concertEventTicket;
  let butcheryGoodsAddress;
  let butcheryGoods;

  // provider
  let provider


  before(async function () {

    // deploy diamond 
    let result = await deployDiamond()
    diamondAddress = result.diamondAddress
    authenticateSCManagerAddress = result.scManagerAddress
    propagationRecorderAddress = result.propagationRecorderAddress
    authenticateSCManager = await ethers.getContractAt('AuthenticateSCManager', authenticateSCManagerAddress)
    propagationRecorder = await ethers.getContractAt('PropagationRecorder', propagationRecorderAddress)
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
    baseInfoFacet = await ethers.getContractAt('BaseInfoFacet', diamondAddress)
    collectionMetaFacet = await ethers.getContractAt('CollectionMetaFacet', diamondAddress)
    royaltyInfoFacet = await ethers.getContractAt('RoyaltyInfoFacet', diamondAddress)
    mintAndBurnFacet = await ethers.getContractAt('RMRKMintAndBurnFacet', diamondAddress)
    rmrkNestableFacet = await ethers.getContractAt('RMRKNestableFacet', diamondAddress)
    whitelistFacet = await ethers.getContractAt('WhitelistFacet', diamondAddress)

    // deploy demo 
    let ticketDeployResult = await deployTicketNFT(authenticateSCManagerAddress)
    galleryEventTicketAddress = ticketDeployResult.galleryEventTicket
    galleryEventTicket = await ethers.getContractAt('GalleryEventTicket', galleryEventTicketAddress)
    concertEventTicketAddress = ticketDeployResult.concertEventTicket
    concertEventTicket = await ethers.getContractAt('ConcertEventTicket', concertEventTicketAddress)
    butcheryGoodsAddress = ticketDeployResult.butcheryGoods
    butcheryGoods = await ethers.getContractAt('ButcheryGoods', butcheryGoodsAddress)

    libERC721 = await ethers.getContractFactory('LibERC721')
    libRMRKNestable = await ethers.getContractFactory('LibNestable')

    provider = waffle.provider
  })

  it('should have ten facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address)
    }

    assert.equal(addresses.length, 10)
  })

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let selectors = getSelectors(diamondCutFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(diamondLoupeFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(ownershipFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2])
    assert.sameMembers(result, selectors)
  })

  it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
    assert.equal(
      addresses[0],
      await diamondLoupeFacet.facetAddress('0x1f931c1c')
    )
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0xcdffacc6')
    )
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0x01ffc9a7')
    )
    assert.equal(
      addresses[2],
      await diamondLoupeFacet.facetAddress('0xf2fde38b')
    )
  })

  it('should get correct base info', async () => {
    const name = await baseInfoFacet.name()
    const symbol = await baseInfoFacet.symbol()
    const scManagerAddress = await baseInfoFacet.authenticateSCManagerAddress()

    assert.equal(name, 'NAIN NFT', 'incorrect NFT name')
    assert.equal(symbol, 'NAIN', 'incorrect NFT symbol')
    assert.equal(scManagerAddress, authenticateSCManagerAddress, 'incorrect sc manager address')
  })

  it('should get correct collection meta info', async () => {
    const collecionMetaUrl = await collectionMetaFacet.collectionMetadata()
    const tokenUri = await collectionMetaFacet.tokenURI(15)

    assert.equal(collecionMetaUrl, 'https://project-oracle-test.mypinata.cloud/ipfs/bafkreidbr7q2hxxsviaks6jrgz4aaicek5ylv5otwdq3v4u2l5op6yc4sq')
    assert.equal(tokenUri, 'https://project-oracle-test.mypinata.cloud/ipfs/QmWUhDtzYcyqovbkefa2oR19fnB4MTk2AC8W6xkY1EBoRv/15')
  })

  it('should get correct royalty info', async () => {
    const royaltyReceipient = await royaltyInfoFacet.getRoyaltyRecipient()
    const royaltyPercentage = await royaltyInfoFacet.getRoyaltyPercentage()
    const accounts = await ethers.getSigners()
    const contractOwner = accounts[0]
    const contractOwnerAddress = await contractOwner.getAddress()
    
    assert.equal(royaltyReceipient, contractOwnerAddress)
    assert.equal(royaltyPercentage, 2)
  })

  it('should not mint before whitelist is initialized', async() => {
    const accounts = await ethers.getSigners()
    const contractOwner = accounts[0]
    const contractOwnerAddress = await contractOwner.getAddress()
    const payValue = ethers.utils.parseUnits("0.001","ether")
    await expect(mintAndBurnFacet.mint(contractOwnerAddress, {value: payValue})).to.be.revertedWith('whitelist is not initialized')
  })

  it('should successfully add an addresses into the whitelist', async() => {
    const accounts = await ethers.getSigners()

    const contractOwnerAddress = await accounts[0].getAddress()
    const anotherAddress = await accounts[1].getAddress()
    
    await expect(whitelistFacet.createWhitelist('main NFT mint whitelist', [contractOwnerAddress, anotherAddress]))
      .to.emit(whitelistFacet, 'WhitelistCreated').withArgs(1)
    
    await mintAndBurnFacet.initializeWhitelistId(1)
  })

  it('should failed to mint one if current address is not in whitelist', async() => {
    const accounts = await ethers.getSigners()
    const address = await accounts[2].getAddress()
    const payValue = ethers.utils.parseUnits("0.001","ether")
    await expect(mintAndBurnFacet.mint(address, {value: payValue})).to.be.revertedWith('current address is not in whitelist')
  })

  // mint a new nestable NFT - should not mint under price
  it('should not mint under price', async () => {
    const accounts = await ethers.getSigners()
    const contractOwner = accounts[0]
    const contractOwnerAddress = await contractOwner.getAddress()
    const payValue = ethers.utils.parseUnits("0.001","ether")
    await expect(mintAndBurnFacet.mint(contractOwnerAddress, {value: payValue})).to.be.revertedWith('RMRKMintUnderpriced')
  })

  // mint a new nestable NFT - should success
  it('should successfully mint a new NFT', async () => {
    const accounts = await ethers.getSigners()
    const contractOwner = accounts[0]
    const contractOwnerAddress = await contractOwner.getAddress()
    const payValue = ethers.utils.parseUnits("0.01","ether")

    await expect(mintAndBurnFacet.mint(contractOwnerAddress, {value: payValue}))
      .to.emit(libERC721.attach(mintAndBurnFacet.address), 'Transfer').withArgs(ethers.constants.AddressZero, contractOwnerAddress, 1)
      .to.emit(libRMRKNestable.attach(mintAndBurnFacet.address), 'NestTransfer').withArgs(ethers.constants.AddressZero, contractOwnerAddress, 0, 0, 1)

    // check balance
    const contractBalance = await provider.getBalance(diamondAddress)
    assert.equal(contractBalance.value, payValue.value)

    // check max supply
    const maxSupply = await baseInfoFacet.maxSupply()
    assert.equal(maxSupply, 16)

    // check owner's balance
    const balance = await rmrkNestableFacet.balanceOf(contractOwnerAddress)
    assert.equal(1, balance)

    // check get token uri by index
    const {tokenId, tokenUri} = await rmrkNestableFacet.getOwnerCollectionByIndex(contractOwnerAddress, 0)
    assert.equal(1, tokenId)
    assert.equal("https://project-oracle-test.mypinata.cloud/ipfs/QmWUhDtzYcyqovbkefa2oR19fnB4MTk2AC8W6xkY1EBoRv/1", tokenUri)
  })

  it('should successfully register gallery ticket and try to add it into main NFT collection', async() => {

    // 1. try to add whitelist smart contract
    await authenticateSCManager.registerWhitelist(galleryEventTicket.address, 1, 0)

    // 2. try to add authenticate smart contract address to authenticateSCManager
    await authenticateSCManager.registerAuthentic(galleryEventTicket.address, 1)

    // 3. try to add this ticket as a child NFT into main NFT's collection
    const payValue = ethers.utils.parseUnits("0.001","ether")
    await expect(galleryEventTicket.nestMint(diamondAddress, 1, 1, {value: payValue}))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildAccepted')
      .withArgs(1, 0, galleryEventTicket.address, 1);

    // 4. check tokenId:1 's child NFT collection
    console.log('check tokneId 1\'s child NFT collection...')
    const child = await rmrkNestableFacet.childrenOf(1);
    assert.equal(1, child.length)
    assert.equal(child[0].contractAddress, galleryEventTicket.address)
    assert.equal(child[0].tokenId, 1)

    // 5. check child NFT's token url
    const tokenUri = await galleryEventTicket.tokenURI(child[0].tokenId)
    assert.equal(tokenUri, 'https://project-oracle-test.mypinata.cloud/ipfs/bafkreihalvnukt7czf7rzkhpel3os3ugznfztycdg376tixenut5izho2u')

    // 6. try to add one more, it should go to the pending child array, emitting `ChildProposed` event
    await expect(galleryEventTicket.nestMint(diamondAddress, 1, 1, {value: payValue}))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildProposed')
      .withArgs(1, 0, galleryEventTicket.address, 2);
    
    // 7. check pending child NFTs
    const pendingChildren = await rmrkNestableFacet.pendingChildrenOf(1)
    assert.equal(pendingChildren.length, 1)
    assert.equal(pendingChildren[0].contractAddress, galleryEventTicket.address)
    assert.equal(pendingChildren[0].tokenId, 2)
  })

  it('should failed to nestmint before registering the whitelist', async() => {
      const payValue = ethers.utils.parseUnits("0.001","ether")
      // the concert event ticket NFT is not added to whitelist, should be reverted
      await expect(concertEventTicket.nestMint(diamondAddress, 1, 1, {value: payValue}))
        .to.be.revertedWith("child NFT address is not whitelisted")
  })

  it('should directly be added into pending children for not authenticated NFT', async () => {
      // register to whitelist first
      await authenticateSCManager.registerWhitelist(concertEventTicket.address, 1, 0)
      
      const payValue = ethers.utils.parseUnits("0.001","ether")
      // we have minted a pending child before, so the initial length of this event should be 1
      await expect(concertEventTicket.nestMint(diamondAddress, 1, 1, {value: payValue}))
        .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildProposed')
        .withArgs(1, 1, concertEventTicket.address, 1);
      
      
      const pendingChildren = await rmrkNestableFacet.pendingChildrenOf(1)
      assert.equal(pendingChildren.length, 2)
      assert.equal(pendingChildren[1].contractAddress, concertEventTicket.address)
      assert.equal(pendingChildren[1].tokenId, 1)

      // query the newly minted tokenUri
      const tokenUri = await concertEventTicket.tokenURI(pendingChildren[1].tokenId)
      assert.equal(tokenUri, 'https://project-oracle-test.mypinata.cloud/ipfs/bafkreigby7f6vpmu6zyosdgmaagkdzx2gocuiqhphgbvbdnuz7qtsamena')
  })

  it('butchery goods should be successfully registerred into whitelist', async() => {
      // register to whitelist
      await authenticateSCManager.registerWhitelist(butcheryGoods.address, 4, 0)
  })

  it('should successfully be accepted when expirable child NFT is valid', async() => {
      // nest mint a butchery goods NFT
      const accounts = await ethers.getSigners()
      const address = await accounts[1].getAddress()

      let acceptingPrice = ethers.utils.parseUnits("0.1", "ether")
      let expireTime = Math.floor((new Date()).getTime() / 1000) + 3 * 30 * 24 * 60 * 60

      // we have minted a pending child before, so the initial length of this event should be 2
      await expect(butcheryGoods.nestMintOne(diamondAddress, 1, acceptingPrice, expireTime))
        .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildProposed')
        .withArgs(1, 2, butcheryGoods.address, 1);


      // check out the pending children queue first
      const pendingChildren = await rmrkNestableFacet.pendingChildrenOf(1)
      assert.equal(pendingChildren.length, 3)
      assert.equal(pendingChildren[2].contractAddress, butcheryGoods.address)
      assert.equal(pendingChildren[2].tokenId, 1)

      // try accept the pending child with lower price
      let lowerPrice = ethers.utils.parseUnits("0.09", "ether")
      await expect(rmrkNestableFacet.acceptChild(1, 2, pendingChildren[2].contractAddress, pendingChildren[2].tokenId, {value: lowerPrice}))
        .to.be.revertedWith("under priced for accepting children!")

      // now the tokenURI should be the normal one
      let tokenURI = await butcheryGoods.tokenURI(1)
      assert.equal("https://project-oracle-test.mypinata.cloud/ipfs/bafkreibgpalkofnmhbz323d5a56s6krog5tagxqckd7fl7b24ayx7slylu", tokenURI)

      await time.increase(2 * 30 * 24 * 60 * 60);

      // since 60% percent of time has elapsed, it should become of nearly expiration
      tokenURI = await butcheryGoods.tokenURI(1)
      assert.equal("https://project-oracle-test.mypinata.cloud/ipfs/bafkreifo3r75hz4ajrb6rr6457m57u6p4275d35k4xitfvkuin34a7zf3q", tokenURI)

      let originalBalance = await provider.getBalance(address)
      let originalSmartContractBalance = await provider.getBalance(diamondAddress)
      // try accept the pending child with higher price
      await expect(rmrkNestableFacet.acceptChild(1, 2, pendingChildren[2].contractAddress, pendingChildren[2].tokenId, {value: acceptingPrice}))
        .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildAccepted')
        .withArgs(1, 2, butcheryGoods.address, 1);

      // should deposit 15% of the price locally and send another 85% to the contract owner
      // we cannot estimate gas fee here, set a 84% threshould to make sure current owner of the contract receive enough bonus
      let currentBalance = await provider.getBalance(address)
      let currentSmartContractBalance = await provider.getBalance(diamondAddress)
      assert.isTrue(currentBalance.sub(originalBalance).eq(ethers.utils.parseUnits((0.1 * 0.85).toString(), "ether")))
      assert.isTrue(currentSmartContractBalance.sub(originalSmartContractBalance).eq(ethers.utils.parseUnits((0.1 * 0.15).toString(), "ether")))
  })

  it('should failed to be accepted when expirable child NFT is expired', async() => {
      // nest mint a butchery goods NFT
      let acceptingPrice = ethers.utils.parseUnits("0.1", "ether")
      let expireTime = Math.floor((new Date()).getTime() / 1000) + 10
      // we have minted a pending child before, so the initial length of this event should also be 2
      await expect(butcheryGoods.nestMintOne(diamondAddress, 1, acceptingPrice, expireTime))
        .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildProposed')
        .withArgs(1, 2, butcheryGoods.address, 2);

      // check out the pending children queue first
      const pendingChildren = await rmrkNestableFacet.pendingChildrenOf(1)
      assert.equal(pendingChildren.length, 3)
      assert.equal(pendingChildren[2].contractAddress, butcheryGoods.address)
      assert.equal(pendingChildren[2].tokenId, 2)

      // sleep 15 seconds to wait for the pending NFT to be expired
      await time.increase(15);

      // since it is already expired, the url should changed expired
      let tokenURI = await butcheryGoods.tokenURI(2)
      assert.equal("https://project-oracle-test.mypinata.cloud/ipfs/bafkreiglkl2a6c4wjfgrexrzawwcne4vaex3fgmhz56wrxbtjrfnpskmr4", tokenURI)

      await expect(rmrkNestableFacet.acceptChild(1, 2, pendingChildren[2].contractAddress, pendingChildren[2].tokenId, {value: acceptingPrice}))
        .to.be.revertedWith("this item is already expired")
  })

  it('should failed to update default rate when operator is not the owner', async() => {
    const accounts = await ethers.getSigners()

    const currentOperator = accounts[1]
    await expect(propagationRecorder.connect(currentOperator).updateDefaultRate(13)).to.be
      .revertedWith('Ownable: caller is not the owner')
  })

  it('should success to update default rate when operator is the owner', async() => {
    await expect(propagationRecorder.updateDefaultRate(14))
      .to.emit(propagationRecorder, 'defaultRateUpdate').withArgs(15, 14)
  })

  it('should successfully accept child NFT in updated charge rate', async () => {
    
    // nest mint a butchery goods NFT
    const accounts = await ethers.getSigners()
    const address = await accounts[1].getAddress()

    let acceptingPrice = ethers.utils.parseUnits("0.1", "ether")
    let expireTime = Math.floor((new Date()).getTime() / 1000) + 3 * 30 * 24 * 60 * 60
    // we have minted a pending child before, so the initial length of this event should also be 2
    await expect(butcheryGoods.nestMintOne(diamondAddress, 1, acceptingPrice, expireTime))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildProposed')
      .withArgs(1, 3, butcheryGoods.address, 3);

    // check out the pending children queue first
    const pendingChildren = await rmrkNestableFacet.pendingChildrenOf(1)
    assert.equal(pendingChildren.length, 4)
    assert.equal(pendingChildren[3].contractAddress, butcheryGoods.address)
    assert.equal(pendingChildren[3].tokenId, 3)
    
    let originalBalance = await provider.getBalance(address)
    let originalSmartContractBalance = await provider.getBalance(diamondAddress)
    await expect(rmrkNestableFacet.acceptChild(1, 3, pendingChildren[3].contractAddress, pendingChildren[3].tokenId, {value: acceptingPrice}))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildAccepted')
      .withArgs(1, 3, butcheryGoods.address, 3);

    // default charge rate has been changed to 12%
    let currentBalance = await provider.getBalance(address)
    let currentSmartContractBalance = await provider.getBalance(diamondAddress)
    console.log("expect: ", ethers.utils.parseUnits((0.086).toString(), "ether"), "current sub: ", currentBalance.sub(originalBalance))
    assert.isTrue(currentBalance.sub(originalBalance).eq(ethers.utils.parseUnits((0.086).toString(), "ether")))
    console.log("expect: ", ethers.utils.parseUnits((0.014).toString(), "ether"), "current sub: ", currentSmartContractBalance.sub(originalSmartContractBalance))
    assert.isTrue(currentSmartContractBalance.sub(originalSmartContractBalance).eq(ethers.utils.parseUnits((0.014).toString(), "ether")))
  
  }) 

  it('should successfully update threshold and record tagged person nums', async() => {
    // nest mint a butchery goods NFT
    const accounts = await ethers.getSigners()
    const address = await accounts[1].getAddress()

    await expect(propagationRecorder.updateLevelSetting(15, 13))
      .to.emit(propagationRecorder, 'thresholdSettingUpdate').withArgs(15, 13)

    await expect(propagationRecorder.record(address, 25))
      .to.emit(propagationRecorder, 'PeopleTaggedUpdate').withArgs(address, 25)
  })

  it('should successfully accept child NFT in updated charge rate with new threshold', async () => {
    // nest mint a butchery goods NFT
    const accounts = await ethers.getSigners()
    const address = await accounts[1].getAddress()

    let acceptingPrice = ethers.utils.parseUnits("0.1", "ether")
    let expireTime = Math.floor((new Date()).getTime() / 1000) + 3 * 30 * 24 * 60 * 60
    // we have minted a pending child before, so the initial length of this event should also be 2
    await expect(butcheryGoods.nestMintOne(diamondAddress, 1, acceptingPrice, expireTime))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildProposed')
      .withArgs(1, 3, butcheryGoods.address, 4);

    // check out the pending children queue first
    const pendingChildren = await rmrkNestableFacet.pendingChildrenOf(1)
    assert.equal(pendingChildren.length, 4)
    assert.equal(pendingChildren[3].contractAddress, butcheryGoods.address)
    assert.equal(pendingChildren[3].tokenId, 4)
    
    let originalBalance = await provider.getBalance(address)
    let originalSmartContractBalance = await provider.getBalance(diamondAddress)
    await expect(rmrkNestableFacet.acceptChild(1, 3, pendingChildren[3].contractAddress, pendingChildren[3].tokenId, {value: acceptingPrice}))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildAccepted')
      .withArgs(1, 3, butcheryGoods.address, 4);

    // default charge rate has been changed to 13%
    let currentBalance = await provider.getBalance(address)
    let currentSmartContractBalance = await provider.getBalance(diamondAddress)
    console.log("expect: ", ethers.utils.parseUnits((0.087).toString(), "ether"), "current sub: ", currentBalance.sub(originalBalance))
    assert.isTrue(currentBalance.sub(originalBalance).eq(ethers.utils.parseUnits((0.087).toString(), "ether")))
    assert.isTrue(currentSmartContractBalance.sub(originalSmartContractBalance).eq(ethers.utils.parseUnits((0.013).toString(), "ether")))
  })

  it('should successfully update threshold again', async() => {
    // nest mint a butchery goods NFT
    const accounts = await ethers.getSigners()
    const address = await accounts[1].getAddress()

    await expect(propagationRecorder.updateLevelSetting(25, 11))
      .to.emit(propagationRecorder, 'thresholdSettingUpdate').withArgs(25, 11)
  })


  it('should successfully accept child NFT in updated charge rate with new threshold - 2', async () => {
    // nest mint a butchery goods NFT
    const accounts = await ethers.getSigners()
    const address = await accounts[1].getAddress()

    let acceptingPrice = ethers.utils.parseUnits("0.1", "ether")
    let expireTime = Math.floor((new Date()).getTime() / 1000) + 3 * 30 * 24 * 60 * 60
    // we have minted a pending child before, so the initial length of this event should also be 2
    await expect(butcheryGoods.nestMintOne(diamondAddress, 1, acceptingPrice, expireTime))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildProposed')
      .withArgs(1, 3, butcheryGoods.address, 5);

    // check out the pending children queue first
    const pendingChildren = await rmrkNestableFacet.pendingChildrenOf(1)
    assert.equal(pendingChildren.length, 4)
    assert.equal(pendingChildren[3].contractAddress, butcheryGoods.address)
    assert.equal(pendingChildren[3].tokenId, 5)
    
    let originalBalance = await provider.getBalance(address)
    let originalSmartContractBalance = await provider.getBalance(diamondAddress)
    await expect(rmrkNestableFacet.acceptChild(1, 3, pendingChildren[3].contractAddress, pendingChildren[3].tokenId, {value: acceptingPrice}))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildAccepted')
      .withArgs(1, 3, butcheryGoods.address, 5);

    // default charge rate has been changed to 13%
    let currentBalance = await provider.getBalance(address)
    let currentSmartContractBalance = await provider.getBalance(diamondAddress)
    assert.isTrue(currentBalance.sub(originalBalance).eq(ethers.utils.parseUnits((0.089).toString(), "ether")))
    assert.isTrue(currentSmartContractBalance.sub(originalSmartContractBalance).eq(ethers.utils.parseUnits((0.011).toString(), "ether")))
  })

  it('should successfully update threshold again - 2', async() => {
    // nest mint a butchery goods NFT
    const accounts = await ethers.getSigners()
    const address = await accounts[1].getAddress()

    await expect(propagationRecorder.updateLevelSetting(35, 9))
      .to.emit(propagationRecorder, 'thresholdSettingUpdate').withArgs(35, 9)
    
    await expect(propagationRecorder.record(address, 40))
      .to.emit(propagationRecorder, 'PeopleTaggedUpdate').withArgs(address, 40)
  })

  it('should successfully accept child NFT in updated charge rate with new threshold - 3', async () => {
    // nest mint a butchery goods NFT
    const accounts = await ethers.getSigners()
    const address = await accounts[1].getAddress()

    let acceptingPrice = ethers.utils.parseUnits("0.1", "ether")
    let expireTime = Math.floor((new Date()).getTime() / 1000) + 3 * 30 * 24 * 60 * 60
    // we have minted a pending child before, so the initial length of this event should also be 2
    await expect(butcheryGoods.nestMintOne(diamondAddress, 1, acceptingPrice, expireTime))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildProposed')
      .withArgs(1, 3, butcheryGoods.address, 6);

    // check out the pending children queue first
    const pendingChildren = await rmrkNestableFacet.pendingChildrenOf(1)
    assert.equal(pendingChildren.length, 4)
    assert.equal(pendingChildren[3].contractAddress, butcheryGoods.address)
    assert.equal(pendingChildren[3].tokenId, 6)
    
    let originalBalance = await provider.getBalance(address)
    let originalSmartContractBalance = await provider.getBalance(diamondAddress)
    await expect(rmrkNestableFacet.acceptChild(1, 3, pendingChildren[3].contractAddress, pendingChildren[3].tokenId, {value: acceptingPrice}))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildAccepted')
      .withArgs(1, 3, butcheryGoods.address, 6);

    // default charge rate has been changed to 9%
    let currentBalance = await provider.getBalance(address)
    let currentSmartContractBalance = await provider.getBalance(diamondAddress)
    assert.isTrue(currentBalance.sub(originalBalance).eq(ethers.utils.parseUnits((0.091).toString(), "ether")))
    assert.isTrue(currentSmartContractBalance.sub(originalSmartContractBalance).eq(ethers.utils.parseUnits((0.009).toString(), "ether")))
  })

  it('should successfully remove a threshold ', async() => {
    // nest mint a butchery goods NFT
    const accounts = await ethers.getSigners()
    const address = await accounts[1].getAddress()

    await expect(propagationRecorder.removeLevelSetting(35))
      .to.emit(propagationRecorder, 'thresholdSettingRemove').withArgs(35)

    await expect(propagationRecorder.updateLevelSetting(25, 10))
      .to.emit(propagationRecorder, 'thresholdSettingUpdate').withArgs(25, 10)
  })

  it('should successfully accept child NFT in updated charge rate with new threshold - 4', async () => {
    // nest mint a butchery goods NFT
    const accounts = await ethers.getSigners()
    const address = await accounts[1].getAddress()

    let acceptingPrice = ethers.utils.parseUnits("0.1", "ether")
    let expireTime = Math.floor((new Date()).getTime() / 1000) + 3 * 30 * 24 * 60 * 60
    // we have minted a pending child before, so the initial length of this event should also be 2
    await expect(butcheryGoods.nestMintOne(diamondAddress, 1, acceptingPrice, expireTime))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildProposed')
      .withArgs(1, 3, butcheryGoods.address, 7);

    // check out the pending children queue first
    const pendingChildren = await rmrkNestableFacet.pendingChildrenOf(1)
    assert.equal(pendingChildren.length, 4)
    assert.equal(pendingChildren[3].contractAddress, butcheryGoods.address)
    assert.equal(pendingChildren[3].tokenId, 7)
    
    let originalBalance = await provider.getBalance(address)
    let originalSmartContractBalance = await provider.getBalance(diamondAddress)
    await expect(rmrkNestableFacet.acceptChild(1, 3, pendingChildren[3].contractAddress, pendingChildren[3].tokenId, {value: acceptingPrice}))
      .to.emit(libRMRKNestable.attach(diamondAddress), 'ChildAccepted')
      .withArgs(1, 3, butcheryGoods.address, 7);

    // default charge rate has been changed to 10%
    let currentBalance = await provider.getBalance(address)
    let currentSmartContractBalance = await provider.getBalance(diamondAddress)
    console.log("expect: ", ethers.utils.parseUnits((0.09).toString(), "ether"), "current sub: ", currentBalance.sub(originalBalance))
    assert.isTrue(currentBalance.sub(originalBalance).eq(ethers.utils.parseUnits((0.09).toString(), "ether")))
    assert.isTrue(currentSmartContractBalance.sub(originalSmartContractBalance).eq(ethers.utils.parseUnits((0.01).toString(), "ether")))
  })

})