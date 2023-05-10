// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { IPropagationRecorder } from "../../interfaces/IPropagationRecorder.sol";
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { Address } from '@openzeppelin/contracts/utils/Address.sol';
import { BokkyPooBahsRedBlackTreeLibrary } from './sort/BokkyPooBahsRedBlackTreeLibrary.sol';

contract PropagationRecorder is IPropagationRecorder, Ownable {

    event PeopleTaggedUpdate(address user, uint256 num);

    event thresholdSettingUpdate(uint256 threshold, uint256 percentage);

    event thresholdSettingRemove(uint256 threshold);

    event defaultRateUpdate(uint256 originalRate, uint256 newRate);


    // user address -> tagged people
    mapping(address => uint256) numTaggedPeople;

    // num of tagged people threshold -> charge percent
    mapping(uint256 => uint256) chargePercent;

    // registered thresholds
    uint256[] thresold;

    // default charge rate
    uint256 internal defaultChargeRate;

    constructor(uint256 _defaultChargeRate) {
        defaultChargeRate = _defaultChargeRate;
    }

    using BokkyPooBahsRedBlackTreeLibrary for BokkyPooBahsRedBlackTreeLibrary.Tree;

    BokkyPooBahsRedBlackTreeLibrary.Tree tree;

    /// @notice Used for recorder's current propagation devotion num
    /// @param  user        user's address
    /// @param  num         user's number of tagged people
    function record(address user, uint256 num) external onlyOwner() {
        require(user != address(0x0), "user address cannot be 0x0");
        require(!Address.isContract(user), "cannot be contract address");
        require(num > 0, "invalid recording num");

        numTaggedPeople[user] = num;

        emit PeopleTaggedUpdate(user, num);
    }

    /// @notice Used for update level settings
    /// @param  threshold   number of tagged people
    /// @param  percentage  charge percentage for user's tagging enough people above this threshold but not transcend the next threshold
    function updateLevelSetting(uint256 threshold, uint256 percentage) external onlyOwner() {
        require(threshold > 0, "invalid threshold value");
        require(percentage > 0 && percentage < 100, "percentage value should between 0 to 100");
        if (tree.exists(threshold)) {
            tree.remove(threshold);
            emit thresholdSettingRemove(threshold);
        }
        tree.insert(threshold);
        chargePercent[threshold] = percentage;

        emit thresholdSettingUpdate(threshold, percentage);
    }

    /// @notice Used for remove level settings
    /// @param  threshold   number of tagged people
    function removeLevelSetting(uint256 threshold) external onlyOwner() {
        require(threshold > 0, "invalid threshold value");
        require(tree.exists(threshold), "current threshold not exist");
        tree.remove(threshold);
        delete chargePercent[threshold];

        emit thresholdSettingRemove(threshold);
    }

    /// @notice Used for update default charge rate
    /// @param  newRate     new charge rate
    function updateDefaultRate(uint256 newRate) external onlyOwner() {
        require(newRate > 0, "new rate should be greater than 0");
        uint256 original = defaultChargeRate;
        defaultChargeRate = newRate;
        emit defaultRateUpdate(original, newRate);
    }

    /// @notice Used for query current charge percent for current user
    /// @notice user        user's address
    /// @return percentage  charge percentage
    function queryChargePercent(address user) external view returns (uint256 percentage) {
        if (numTaggedPeople[user] == 0) {
            return defaultChargeRate;
        }

        uint256 num = numTaggedPeople[user];

        uint256 prevKey = tree.searchPrev(num);

        if (prevKey == 0) {
            return defaultChargeRate;
        }

        return chargePercent[prevKey];
    }

}