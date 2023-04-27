// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { IAuthenticateSCManager } from "../../interfaces/IAuthenticateSCManager.sol";
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { Address } from '@openzeppelin/contracts/utils/Address.sol';
import 'hardhat/console.sol';


contract AuthenticateSCManager is IAuthenticateSCManager, Ownable {

    /** authenticated smarcontract address -> max active children num mapping */
    mapping(address => uint256) authenticateSC;

    /** white listed smart contract address, only these recorded address can be added as child to main NFT */
    mapping(address => uint256) whitelistSC;

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
    /// @param contractAddress        the to-whitelisted smart contract address
    /// 
    function registerWhitelist(address contractAddress) external onlyOwner() {
        require(Address.isContract(contractAddress), "not a smart contract address");
        require(whitelistSC[contractAddress] == 0, "whitelist address exists");

        whitelistSC[contractAddress] = 1;
    }

    /// @notice    used for check if given contract address is whitelisted to be added into `_pendingChildren`
    /// @param     contractAddress        the to-authenticate smart contract address
    /// @return    authentic              check if the contract address has been registered
    /// 
    function whitelisted(address contractAddress) external view returns (bool authentic) {
        return whitelistSC[contractAddress] > 0;
    }

    /// @notice used for remove whitelist smart contract address
    /// @notice only the contract owner can call this method
    /// @param contractAddress        the to-removed-whitelisted smart contract address
    /// 
    function removeWhitelist(address contractAddress) external onlyOwner() {
        require(Address.isContract(contractAddress), "not a smart contract address");
        require(whitelistSC[contractAddress] > 0, "whitelist address does not exists");

        delete whitelistSC[contractAddress];
    }

}