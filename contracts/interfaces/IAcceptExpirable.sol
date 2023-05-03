// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/// @notice used for decorate an NFT that with a limited acceptance time
interface IAcceptExpirable {

    /// @notice used for check if current token is expired for accepting
    /// @dev should check if this token exists or not
    /// @param  tokenId     the to-check expired token
    /// @return expired     true: this child NFT token is expired for accepting
    function expired(uint256 tokenId) external view returns (bool);

    /// @notice used for refresh token's expiration
    /// @dev should check if this token exists or not
    /// @param  tokenId     the to-refreshed token id
    function refresh(uint256 tokenId, uint256 ) external;

}