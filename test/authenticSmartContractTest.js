const { assert, expect } = require('chai')
const { ethers } = require('hardhat')

const { deployAuthenticSCManager } = require('../scripts/deployAuthenticSC.js')
const { deployTicketNFT } = require('../scripts/deployTicketNFT.js')


describe('authenticSmartContractTest', async function() {

    let authenticSCManagerAddress

    // contract instance
    let authenticSCManager
    let concertEventTicket
    let butcheryGoods

    // contract addresses
    let galleryEventTicketAddress 
    let concertEventTicketAddress
    let butcheryGoodsAddress


    before(async function () {
        authenticSCManagerAddress = await deployAuthenticSCManager()
        authenticSCManager = await ethers.getContractAt('AuthenticateSCManager', authenticSCManagerAddress)

        ticketAddressInfo = await deployTicketNFT(authenticSCManagerAddress)
        galleryEventTicketAddress = ticketAddressInfo.galleryEventTicket
        concertEventTicketAddress = ticketAddressInfo.concertEventTicket
        butcheryGoodsAddress = ticketAddressInfo.butcheryGoods

        concertEventTicket = await ethers.getContractAt('ConcertEventTicket', concertEventTicketAddress)
        butcheryGoods = await ethers.getContractAt('ButcheryGoods', butcheryGoodsAddress)
    })

    it('should fail on adding authenticate smart contract when current operator is not the owner', async() => {
        const accounts = await ethers.getSigners()
        const currentOperator = accounts[1]

        const smartContractAddress = '0xdb211f4CB3d1a3BC904e47f7A7c7932312ABD24a'

        await expect(authenticSCManager.connect(currentOperator).registerAuthentic(smartContractAddress, 1))
                .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should fail on adding authenticate smart contract when parameter is invalid', async() => {
        await expect(authenticSCManager.registerAuthentic(concertEventTicket.address, 0))
                .to.be.revertedWith('max active num should be greater than 0')
    })

    it('should success on adding authenticate smart contract when current operator is the contract owner', async() => {
                
        await authenticSCManager.registerAuthentic(concertEventTicket.address, 1)
        const {authentic, maxActiveNum} = await authenticSCManager.authenticated(concertEventTicketAddress)

        assert.isTrue(authentic)
        assert.equal(maxActiveNum, 1)

    })

    it('should fail on deleting authenticated smart contract when current operator is not the contract owner', async() => {
        const accounts = await ethers.getSigners()
        const currentOperator = accounts[1]

        await expect(authenticSCManager.connect(currentOperator).removeAuthenticate(concertEventTicketAddress))
                .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should successfully remove authenticate smart contract', async() => {

        // start deleting authenticated smart contract
        await authenticSCManager.removeAuthenticate(concertEventTicketAddress)
        result = await authenticSCManager.authenticated(concertEventTicketAddress)


        assert.isFalse(result.authentic)
        assert.equal(result.maxActiveNum, 0)
    })

    it('should failed to add whitelist config, when the operator is not the contract owner', async() => {
        const accounts = await ethers.getSigners()
        const currentOperator = accounts[1]

        await expect(authenticSCManager.connect(currentOperator).registerWhitelist(concertEventTicketAddress, 1, 0))
                .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should successfully add whitelist config', async() => {
        await authenticSCManager.registerWhitelist(concertEventTicketAddress, 1, 0)
        result = await authenticSCManager.whitelisted(concertEventTicketAddress)
        assert.isTrue(result)

        price = await authenticSCManager.queryPrice(concertEventTicketAddress, 1)
        assert.equal(price, 0)
    })

    it('should failed when removing out not registering whitelist smart contract', async() => {
        await expect(authenticSCManager.removeWhitelist(galleryEventTicketAddress))
            .to.be.revertedWith('whitelist address does not exists')
    })

    it('should failed when removing out registerred whitelist smart contract when operator is not the contract owner', async() => {
        const accounts = await ethers.getSigners()
        const currentOperator = accounts[1]
        await expect(authenticSCManager.connect(currentOperator).removeWhitelist(concertEventTicketAddress))
            .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should success when removing out registerred whitelist smart contract when current operator is the owner', async() => {
        await authenticSCManager.removeWhitelist(concertEventTicketAddress)
        result = await authenticSCManager.whitelisted(concertEventTicketAddress)
        assert.isFalse(result)
    })  

    it('should successfully add other whitelist config - type 2', async() => {
        const payValue = ethers.utils.parseUnits("0.01","ether")
        await authenticSCManager.registerWhitelist(galleryEventTicketAddress, 2, payValue)

        result = await authenticSCManager.whitelisted(galleryEventTicketAddress)
        assert.isTrue(result)
        price = await authenticSCManager.queryPrice(galleryEventTicketAddress, 1)
        assert.equal(price.value, ethers.utils.parseUnits("0.01","ether").value)
    })

    it('should successfully add other whitelist config - type 3', async() => {
        await authenticSCManager.registerWhitelist(butcheryGoodsAddress, 3, 0)

        result = await authenticSCManager.whitelisted(butcheryGoodsAddress)
        assert.isTrue(result)

        // try to nest mint one
        const accounts = await ethers.getSigners()
        const currentOperator = accounts[0]
        const payValue = ethers.utils.parseUnits("0.001","ether")
        await concertEventTicket.mint(currentOperator.address, 1, {value: payValue})

        let expireTime = Math.floor((new Date()).getTime() / 1000) + 3 * 30 * 24 * 60 * 60

        await butcheryGoods.nestMintOne(concertEventTicketAddress, 1, ethers.utils.parseUnits("10", "ether"), expireTime)
        await butcheryGoods.nestMintOne(concertEventTicketAddress, 1, ethers.utils.parseUnits("1", "ether"), expireTime)

        firstPrice = await authenticSCManager.queryPrice(butcheryGoodsAddress, 1)
        assert.equal(price.value, ethers.utils.parseUnits("10", "ether").value)
        secondPrice = await authenticSCManager.queryPrice(butcheryGoodsAddress, 2)
        assert.equal(price.value, ethers.utils.parseUnits("1", "ether").value)
    })
})