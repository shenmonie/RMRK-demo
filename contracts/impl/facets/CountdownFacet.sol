// SPDX-License-Identifier: Apache-2.0

//Generally all interactions should propagate downstream

pragma solidity ^0.8.16;
import {Modifiers} from "../../storage/LibAppStorage.sol";
import {LibCountdown} from "../libs/LibCountdown.sol";

contract CountdownFacet is Modifiers {
    //@notice used for starting countdown
    function countdown(uint256 tokenId, uint256 countdownTime) public {
        LibCountdown.countdown(tokenId, countdownTime);
    }

    // check if this NFT is still valid
    function isValid(uint256 tokenId) public view returns (bool) {
        return LibCountdown.isValid(tokenId);
    }
}
