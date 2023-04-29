// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.16;

import {LibAppStorage, AppStorage} from "../../storage/LibAppStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

library LibCountdown {
    using Strings for uint256;

    /**
     * @notice Used to retrieve the metadata URI prefix of a token based on validity
     * @param tokenId ID of the token to retrieve the metadata URI prefix for
     * @return Metadata URI prefix of the specified token
     */
    function getTokenURIPrefix(uint256 tokenId) internal view returns (string memory) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        if (isValid(tokenId)) {
            return s._validTokenURIPrefix;
        }
        return s._invalidTokenURIPrefix;
    }

    /**
     * @notice Used to check the validity of the token
     * @param tokenId ID of the token to retrieve the validity
     * @return validity of the token, true for valid and false for invalid
     */
    function isValid(uint256 tokenId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        require(s._tokenCreateTime[tokenId] != 0, "Token does not exist!");
        if (s._tokenValidTime[tokenId] == 0 || block.timestamp <= s._tokenCreateTime[tokenId] + s._tokenValidTime[tokenId]) {
            return true;
        }
        return false;
    }

    /**
     * @notice Used to start countdown for the token
     * @param tokenId ID of the token to start countdown
     */
    function countdown(uint256 tokenId, uint256 countdownTime) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s._tokenCreateTime[tokenId] = countdownTime;
    }
}
