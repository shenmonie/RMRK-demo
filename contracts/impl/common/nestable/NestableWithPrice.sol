// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@rmrk-team/evm-contracts/contracts/implementations/nativeTokenPay/RMRKNestableImpl.sol";
import { IAuthenticateSCManager } from "../../../interfaces/IAuthenticateSCManager.sol";

error NotSupported();

/// @notice used for NFTs that can register new prices during every nest mint
contract NestableWithPrice is RMRKNestableImpl {

    /** smart contract manager address -> used for recording each token's accepting price */
    address internal _scManagerAddress;

    constructor(
        address scManagerAddress,
        string memory name_,
        string memory symbol_,
        string memory collectionMetadata_,
        string memory tokenURI_,
        InitData memory data
    ) RMRKNestableImpl(name_, symbol_, collectionMetadata_, tokenURI_, data) {
        _scManagerAddress = scManagerAddress;
    }

    function nestMint(
        address to,
        uint256 numToMint,
        uint256 destinationId
    ) public payable override {
        revert NotSupported();
    }

    /// @notice used to nest mint a child NFT with price 
    /// @dev should register a price in the smart contract manager first
    /// @param  to                  the target parent smart contract address
    /// @param  numToMint           number of newly minted child NFT
    /// @param  destinationId       the target parent token id
    /// @param  price               the price for accepting this child NFT
    function nestMintWithPrice(
        address to, 
        uint256 numToMint,
        uint256 destinationId,
        uint256 price
    )  public payable virtual notLocked {
        require(price > 0, "price should not be zero");
        (uint256 nextToken, uint256 totalSupplyOffset) = _preMint(numToMint);

        for (uint256 i = nextToken; i < totalSupplyOffset; ) {
            IAuthenticateSCManager(_scManagerAddress).registerPrice(address(this), i, price);
            _nestMint(to, i, destinationId, "");
            unchecked {
                ++i;
            }
        }
    }
    
}