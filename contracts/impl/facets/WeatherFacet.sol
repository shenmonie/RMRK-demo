// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
// import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import {Modifiers, RequestParams, LocationResult, CurrentConditionsResult} from "../../storage/LibAppStorage.sol";
import {LibChainlink} from "../libs/LibChainlink.sol";
import {Chainlink} from "@chainlink/contracts/src/v0.8/Chainlink.sol";

contract WeatherFacet is Modifiers {
    using Chainlink for Chainlink.Request;

    /**
     * @notice Returns the current weather conditions of a location by ID.
     * @param _specId the jobID.
     * @param _payment the LINK amount in Juels (i.e. 10^18 aka 1 LINK).
     * @param _locationKey the location ID.
     * @param _units the measurement system ("metric" or "imperial").
     */
    function requestCurrentConditions(
        bytes32 _specId,
        uint256 _payment,
        uint256 _locationKey,
        string calldata _units,
        uint256 _token
    ) public returns (bytes32) {
        Chainlink.Request memory req = LibChainlink.buildChainlinkRequest(_specId, s.diamondAddress, this.fulfillCurrentConditions.selector);
        s.lastRequestURL = string(
            abi.encodePacked("https://dataservice.accuweather.com/currentconditions/v1/", _locationKey, "?apikey=", s.accuWeatherApiKey)
        );

        // s.lastRequestURL = "https://dataservice.accuweather.com/currentconditions/v1/101924?apikey=Tcgdisc5DGZsPBfK6RgYgFFQY62beLSy";
        req.add("get", s.lastRequestURL);
        req.add("path", "0,WeatherText");
        return LibChainlink.sendChainlinkRequest(req, _token, _payment);
    }

    /**
     * @notice Consumes the data returned by the node job on a particular request.
     * @param _requestId the request ID for fulfillment.
     * @param _currentConditionsResult the current weather conditions (encoded as CurrentConditionsResult).
     */
    function fulfillCurrentConditions(bytes32 _requestId, bytes memory _currentConditionsResult) public recordChainlinkFulfillment(_requestId) {
        storeCurrentConditionsResult(_requestId, _currentConditionsResult);
        // emit CurrentCondition();
    }

    /* ========== PRIVATE FUNCTIONS ========== */
    function storeCurrentConditionsResult(bytes32 _requestId, bytes memory _currentConditionsResult) private {
        CurrentConditionsResult memory result = abi.decode(_currentConditionsResult, (CurrentConditionsResult));
        s.requestIdCurrentConditionsResult[_requestId] = result;
    }

    modifier recordChainlinkFulfillment(bytes32 requestId) {
        emit LibChainlink.ChainlinkFulfilled(requestId);
        _;
    }

    // function lastRequestURL() public view returns (string memory) {
    //     return s.accuWeatherApiKey;
    // }
    event CurrentCondition(string indexed weather, string indexed temperature);
}
