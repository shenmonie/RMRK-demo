// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

// used as the interface for user's propagation devotion recording
interface IPropagationRecorder {

    /// @notice Used for recorder's current propagation devotion num
    /// @param  user        user's address
    /// @param  num         user's number of tagged people
    function record(address user, uint256 num) external;

    /// @notice Used for update level settings
    /// @param  threshold   number of tagged people
    /// @param  percentage  charge percentage for user's tagging enough people above this threshold but not transcend the next threshold
    function updateLevelSetting(uint256 threshold, uint256 percentage) external;

    /// @notice Used for remove level settings
    /// @param  threshold   number of tagged people
    function removeLevelSetting(uint256 threshold) external;

    /// @notice Used for query current charge percent for current user
    /// @notice user        user's address
    /// @return percentage  charge percentage
    function queryChargePercent(address user) external returns (uint256 percentage);
}