// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface IAuthenticateSCManager {
    
    /// @notice used for register authenticated smart contract address
    /// @notice only the contract owner can call this method
    /// @param contractAddress        the to-authenticate smart contract address
    /// @param maxActiveNum           maximal number of NFT from the same contract address can be added into `_activeChildren`  
    /// 
    function registerAuthentic(address contractAddress, uint256 maxActiveNum) external;
    
    /// @notice    used for check if given contract address is authenticated to be directly added into `_activeChildren`
    /// @notice    when this contract address is not authenticated, the `maxActiveNum` returns 0
    /// @param     contractAddress        the to-authenticate smart contract address
    /// @return    authentic              check if the contract address has been registered
    /// @return    maxActiveNum           maximal number of NFT from the same contract address can be added into `_activeChildren`
    /// 
    function authenticated(address contractAddress) external view returns (bool authentic, uint256 maxActiveNum);

    /// @notice used for remove authenticated smart contract address
    /// @notice only the contract owner can call this method
    /// @param contractAddress        the de-authenticate smart contract address
    /// 
    function removeAuthenticate(address contractAddress) external;

    /// @notice used for register whitelist smart contract address
    /// @notice only the contract owner can call this method
    /// @param  contractAddress        the to-whitelisted smart contract address
    /// @param  nftType                the type of NFT
    /// @param  price                  price for user to append it as him/her active child, denoted in Wei 
    function registerWhitelist(address contractAddress, uint256 nftType, uint256 price) external;

    /// @notice used for query the type nft
    /// @param  contractAddress        the to-whitelisted smart contract address
    function nftType(address contractAddress) external view returns (uint256);

    /// @notice    used for check if given contract address is whitelisted to be added into `_pendingChildren`
    /// @param     contractAddress        the to-authenticate smart contract address
    /// @return    authentic              check if the contract address has been registered
    /// 
    function whitelisted(address contractAddress) external view returns (bool authentic);

    /// @notice used for remove whitelist smart contract address
    /// @notice only the contract owner can call this method
    /// @param contractAddress        the to-removed-whitelisted smart contract address
    /// 
    function removeWhitelist(address contractAddress) external;

    /// @notice used for register NFT's price when nest minting child NFT
    /// @param  contractAddress       the child NFT address
    /// @param  tokenId               child NFT's tokenId in its original contract
    /// @param  price                 the price for adding this NFT to active children
    function registerPrice(address contractAddress, uint256 tokenId, uint256 price) external;  

    /// @notice used for query price for adding this child NFT
    /// @param  contractAddress       the to-check child NFT contract address
    /// @param  tokenId               child NFT's tokenId in its original contract
    /// @return price                 price for appending this child NFT as active child NFT
    function queryPrice(address contractAddress, uint256 tokenId) external view returns (uint256 price);

    /// @notice used for adding expire time
    /// @param  contractAddress       the to-check child NFT contract address
    /// @param  tokenId               child NFT's tokenId in its original contract
    /// @param  expireTime            expire time for acceptance
    function addExpireTime(address contractAddress, uint256 tokenId, uint256 expireTime) external;

    /// @notice used for query NFT's expire time
    /// @param  contractAddress       the to-check child NFT contract address
    /// @param  tokenId               child NFT's tokenId in its original contract
    function expireTime(address contractAddress, uint256 tokenId) external view returns (uint256);

    /// @notice used for checking if current child NFT is expired for acceptance
    /// @param  contractAddress       the to-check child NFT contract address
    /// @param  tokenId               child NFT's tokenId in its original contract
    function expired(address contractAddress, uint256 tokenId) external view returns (bool);

    /// @notice used for postpone the expire time for child NFT
    /// @param  contractAddress       the to-check child NFT contract address
    /// @param  tokenId               child NFT's tokenId in its original contract
    /// @param  period                postpone time denoted in seconds
    function postpone(address contractAddress, uint256 tokenId, uint256 period) external;
}