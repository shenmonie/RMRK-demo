// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {LibAppStorage, AppStorage} from "../storage/LibAppStorage.sol";
import {OperatorInterface} from "@chainlink/contracts/src/v0.8/interfaces/OperatorInterface.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

contract WeatherFacetInit {
    function init(address diamondAddress, string memory accuWeatherApiKey) external {
        AppStorage storage s = LibAppStorage.diamondStorage();

        s.diamondAddress = diamondAddress;
        s.s_oracle = OperatorInterface(0x40193c8518BB267228Fc409a613bDbD8eC5a97b3);
        s.s_link = LinkTokenInterface(0x326C977E6efc84E512bB9C30f76E30c160eD06FB);
        s.jobId = "7da2702f37fd48e5b1b9a5715e3509b6";
        s.accuWeatherApiKey = accuWeatherApiKey;
        s.chainlinkRequestFee = 1;
        s.s_requestCount = 1;
    }
}
