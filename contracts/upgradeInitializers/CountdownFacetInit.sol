// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {LibAppStorage, AppStorage} from "../storage/LibAppStorage.sol";

contract CountdownFacetInit {
    /**
     * init setup for royalty info facet
     */
    function init(string memory validTokenURIPrefix, string memory invalidTokenURIPrefix, uint256 defaultCountdownTime) public {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s._validTokenURIPrefix = validTokenURIPrefix;
        s._invalidTokenURIPrefix = invalidTokenURIPrefix;
        s._defaultCountdownTime = defaultCountdownTime;
    }
}
