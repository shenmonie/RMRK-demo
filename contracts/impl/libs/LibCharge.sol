// SPDX-License-Identifier: Apache-2.0

//Generally all interactions should propagate downstream

pragma solidity ^0.8.16;
import { LibAppStorage, AppStorage } from "../../storage/LibAppStorage.sol";
import { IPropagationRecorder } from "../../interfaces/IPropagationRecorder.sol";
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { LibMeta } from "../../shared/LibMeta.sol";

library LibCharge {

    function charge(address childContractAddress) internal {

        require(LibMeta._msgValue() > 0, "invalid transfer value from user");
        
        AppStorage storage s = LibAppStorage.diamondStorage();
        address propagationRecorderAddress = s._propagationRecorderAddress;

        address owner = Ownable(childContractAddress).owner();

        // get charge rate, transfer the rest of ether to the owner of the contract
        uint256 chargePercent = IPropagationRecorder(propagationRecorderAddress).queryChargePercent(owner);

        payable(owner).transfer(LibMeta._msgValue() * (100 - chargePercent) / 100);
    }
}