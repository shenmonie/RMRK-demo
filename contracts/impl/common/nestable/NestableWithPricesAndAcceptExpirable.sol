// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { RMRKNestable } from "@rmrk-team/evm-contracts/contracts/RMRK/nestable/RMRKNestable.sol";
import { IAuthenticateSCManager } from "../../../interfaces/IAuthenticateSCManager.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@rmrk-team/evm-contracts/contracts/implementations/nativeTokenPay/RMRKNestableImpl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @notice used for NFTs that can register new prices and expire time for acceptance during every nest mint
contract NestableWithPricesAndAcceptExpirable is RMRKNestableImpl {

    using Strings for uint256;

    mapping(uint256 => uint256) registerTime;

    bool private _tokenUriEnumerable;

    address internal _scManagerAddress;

    string internal _nearlyExpireURI;

    string internal _expireURI;

    string internal _normalURI;

    uint256 _nearlyExpiredThreshold;

    constructor(
        address scManagerAddress,
        uint256 nearlyExpiredThreshold_,
        string memory nearlyExpireURI_,
        string memory expireURI_,
        string memory name_,
        string memory symbol_,
        string memory collectionMetadata_,
        string memory tokenURI_,
        InitData memory data
    ) 
    RMRKNestableImpl(name_, symbol_, collectionMetadata_, tokenURI_, data)
    {
        _scManagerAddress = scManagerAddress;
        _nearlyExpireURI = nearlyExpireURI_;
        _expireURI = expireURI_;
        _normalURI = tokenURI_;
        _nearlyExpiredThreshold = nearlyExpiredThreshold_;
        _tokenUriEnumerable = data.tokenUriIsEnumerable;
    } 

    function nestMintOne(address to, uint256 destinationId, uint256 price, uint256 expireTime) external {
        require(price > 0, "price should not be zero");
        require(expireTime > 0, "invalid expire time");
        (uint256 nextToken, uint256 totalSupplyOffset) = _preMint(1);

        registerTime[nextToken] = block.timestamp;

        IAuthenticateSCManager(_scManagerAddress).addExpireTime(address(this), nextToken, expireTime);
        // register price
        IAuthenticateSCManager(_scManagerAddress).registerPrice(address(this), nextToken, price);
        _nestMint(to, nextToken, destinationId, "");
    }

    /**
     * @notice Used to retrieve the metadata URI of a token by its expiring status
     * @param tokenId ID of the token to retrieve the metadata URI for
     * @return Metadata URI of the specified token
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        uint256 expireTime = IAuthenticateSCManager(_scManagerAddress).expireTime(address(this), tokenId);
        if (block.timestamp > expireTime) {
            return _tokenUriEnumerable
                ? string(abi.encodePacked(_expireURI, tokenId.toString())) : _expireURI;
        }

        uint256 createTime = registerTime[tokenId];

        uint256 elapsedPeriod = (block.timestamp - createTime) * 100 / (expireTime - createTime);
        if (elapsedPeriod < _nearlyExpiredThreshold) {
            return _tokenUriEnumerable
                ? string(abi.encodePacked(_normalURI, tokenId.toString())) : _normalURI;
        } else {
            return _tokenUriEnumerable
                ? string(abi.encodePacked(_nearlyExpireURI, tokenId.toString())) : _nearlyExpireURI;
        }
    }
}