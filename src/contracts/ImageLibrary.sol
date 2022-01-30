pragma solidity ^0.8.0;

library ImageLibrary {
    struct Image {
        uint256 id;
        string hash;
        string description;
        string longtitude;
        string latitude;
        string gender;
        uint256 stakeAmount;
        uint stakeTime;
        uint256 tipAmount;
        address payable author;
    }
}
