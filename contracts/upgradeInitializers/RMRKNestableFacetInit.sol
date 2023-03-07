// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {LibAppStorage, AppStorage} from "../storage/LibAppStorage.sol";

contract RMRKNestableFacetInit {
    /**
     * init setup for RMRKNestable Facet plugin
     */
    function init(string memory name, string memory symbol) public {
        AppStorage storage s = LibAppStorage.diamondStorage();

        s._name = name;
        s._symbol = symbol;
    }
}
