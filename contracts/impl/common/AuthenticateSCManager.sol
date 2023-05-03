// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { IAuthenticateSCManager } from "../../interfaces/IAuthenticateSCManager.sol";
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { Address } from '@openzeppelin/contracts/utils/Address.sol';

contract AuthenticateSCManager is IAuthenticateSCManager, Ownable {

    /** authenticated smarcontract address -> max active children num mapping */
    mapping(address => uint256) authenticateSC;

    /** white listed smart contract address, only these recorded address can be added as child to main NFT */
    mapping(address => uint256) whitelistSC;
    /** NFT sell in uniform prices */
    mapping(address => uint256) uniformPrices;
    /** NFT sell in changable prices for each tokenId */
    mapping(address => mapping(uint256 => uint256)) customPrices;
    /** NFT with expire time for acceptance */
    mapping(address => mapping(uint256 => uint256)) _expireTime;

    /**
     * Decoration: should check if the current operator is the owner of the token or is approved to operate the token
     */
    modifier onlyWhitelisted(address contractAddress) {
        require(whitelistSC[contractAddress] > 0, "whitelist address does not exists");
        _;
    }

    /// @notice used for register authenticated smart contract address
    /// @notice only the contract owner can call this method
    /// @param contractAddress        the to-authenticate smart contract address
    /// @param maxActiveNum           maximal number of NFT from the same contract address can be added into `_activeChildren`  
    /// 
    function registerAuthentic(address contractAddress, uint256 maxActiveNum) external onlyOwner() {

        require(maxActiveNum > 0, "max active num should be greater than 0");
        require(Address.isContract(contractAddress), "not a smart contract address");
        require(authenticateSC[contractAddress] == 0, "authenticate address exists!");
        
        authenticateSC[contractAddress] = maxActiveNum;
    }

    /// @notice    used for check if given contract address is authenticated to be directly added into `_activeChildren`
    /// @notice    when this contract address is not authenticated, the `maxActiveNum` returns 0
    /// @param     contractAddress        the to-authenticate smart contract address
    /// @return    authentic              check if the contract address has been registered
    /// @return    maxActiveNum           maximal number of NFT from the same contract address can be added into `_activeChildren`
    /// 
    function authenticated(address contractAddress) external view returns (bool authentic, uint256 maxActiveNum) {
        maxActiveNum = authenticateSC[contractAddress];
        return (maxActiveNum > 0, maxActiveNum);
    }

    /// @notice used for remove authenticated smart contract address
    /// @notice only the contract owner can call this method
    /// @param contractAddress        the de-authenticate smart contract address
    /// 
    function removeAuthenticate(address contractAddress) external onlyOwner() {
        require(Address.isContract(contractAddress), "not a smart contract address");
        require(authenticateSC[contractAddress] > 0, "authenticate address does not exists!");

        delete authenticateSC[contractAddress];
    }

    /// @notice used for register whitelist smart contract address
    /// @notice only the contract owner can call this method
    /// @param  contractAddress        the to-whitelisted smart contract address
    /// @param  nftType                the type of NFT
    /// - 1: free 
    /// - 2: sell in uniform price
    /// - 3: sell in custom price
    ///         this map will be modified during each child NFT owner's nestmint process to register a new price 
    ///         for newly minted NFT token id
    /// - 4: expirable nft
    /// @param  price                  price for user to append it as him/her active child, denoted in Wei 
    /// 
    function registerWhitelist(address contractAddress, uint256 nftType, uint256 price) external onlyOwner() {
        require(Address.isContract(contractAddress), "not a smart contract address");
        require(whitelistSC[contractAddress] == 0, "whitelist address exists");

        if (nftType == 1) {
            require(price == 0, "price for Type 1 NFT should be 0(free)");
        }

        whitelistSC[contractAddress] = nftType;

        if (nftType == 2) {
            // use `uniformPrices` to register uniform price
            uniformPrices[contractAddress] = price;
        }
    }

    /// @notice    used for check if given contract address is whitelisted to be added into `_pendingChildren`
    /// @param     contractAddress        the to-authenticate smart contract address
    /// @return    authentic              check if the contract address has been registered
    /// 
    function whitelisted(address contractAddress) external view returns (bool authentic) {
        require(Address.isContract(contractAddress), "not a smart contract address");
        return whitelistSC[contractAddress] > 0;
    }

    /// @notice used for remove whitelist smart contract address
    /// @notice only the contract owner can call this method
    /// @param contractAddress        the to-removed-whitelisted smart contract address
    /// 
    function removeWhitelist(address contractAddress) external onlyOwner() onlyWhitelisted(contractAddress) {
        require(Address.isContract(contractAddress), "not a smart contract address");
        delete whitelistSC[contractAddress];
    }

    /// @notice used for register NFT's price when nest minting child NFT
    /// @param  contractAddress       the child NFT address
    /// @param  tokenId               child NFT's tokenId in its original contract
    /// @param  price                 the price for adding this NFT to active children
    function registerPrice(address contractAddress, uint256 tokenId, uint256 price) external onlyWhitelisted(contractAddress) {
        require(Address.isContract(contractAddress), "not a smart contract address");
        require(this.whitelisted(contractAddress), "not a whitelisted smart contract");
        require(whitelistSC[contractAddress] >= 3, "not a custom price token");        
        require(tokenId > 0, "not a valid tokenId");

        customPrices[contractAddress][tokenId] = price;
    } 

    /// @notice used for query the type nft
    /// @param  contractAddress        the to-whitelisted smart contract address
    function nftType(address contractAddress) external view onlyWhitelisted(contractAddress) returns (uint256) {
        return whitelistSC[contractAddress];
    }


    /// @notice used for query price for adding this child NFT
    /// @param  contractAddress       the to-check child NFT contract address
    /// @param  tokenId               child NFT's tokenId in its original contract
    /// @return price                 price for appending this child NFT as active child NFT
    function queryPrice(address contractAddress, uint256 tokenId) external view onlyWhitelisted(contractAddress) returns (uint256 price) {
        require(Address.isContract(contractAddress), "not a smart contract address");
        require(this.whitelisted(contractAddress), "not a whitelisted smart contract");

        // query the custom price first
        uint256 nftType = whitelistSC[contractAddress];
        if (nftType == 1) {
            return 0;
        }

        if (customPrices[contractAddress][tokenId] > 0) {
            return customPrices[contractAddress][tokenId];
        }

        return uniformPrices[contractAddress];
    }

    /// @notice used for adding expire time
    /// @param  contractAddress       the to-check child NFT contract address
    /// @param  tokenId               child NFT's tokenId in its original contract
    /// @param  expireTime            expire time for acceptance in ms
    function addExpireTime(address contractAddress, uint256 tokenId, uint256 expireTime) external onlyWhitelisted(contractAddress) {
        require(_expireTime[contractAddress][tokenId] == 0, "already register expire time");
        _expireTime[contractAddress][tokenId] = expireTime;
    }

    /// @notice used for query NFT's expire time
    /// @param  contractAddress       the to-check child NFT contract address
    /// @param  tokenId               child NFT's tokenId in its original contract
    function expireTime(address contractAddress, uint256 tokenId) external view onlyWhitelisted(contractAddress) returns (uint256) {
        return _expireTime[contractAddress][tokenId];
    }

    /// @notice used for checking if current child NFT is expired for acceptance
    /// @param  contractAddress       the to-check child NFT contract address
    /// @param  tokenId               child NFT's tokenId in its original contract
    function expired(address contractAddress, uint256 tokenId) external view  onlyWhitelisted(contractAddress) returns (bool)  {
        require(_expireTime[contractAddress][tokenId] > 0, "invalid expire time check");
        return _expireTime[contractAddress][tokenId] <= block.timestamp;
    }

    /// @notice used for postpone the expire time for child NFT
    /// @param  contractAddress       the to-check child NFT contract address
    /// @param  tokenId               child NFT's tokenId in its original contract
    /// @param  period                postpone time denoted in seconds
    function postpone(address contractAddress, uint256 tokenId, uint256 period) external onlyWhitelisted(contractAddress) {
        require(!this.expired(contractAddress, tokenId), "invalid tokenId, may not exist or expired");
        _expireTime[contractAddress][tokenId] += period;
    }

}