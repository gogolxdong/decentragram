pragma solidity ^0.8.0;
import "./ImageLibrary.sol";

contract Decentragram {
    string public name;
    uint256 public imageCount = 0;
    mapping(uint256 => ImageLibrary.Image) public images;

    event ImageCreated(
        uint256 id,
        string hash,
        string description,
        string longtitude,
        string latitude,
        string gender,
        uint256 stakeAmount,
        uint256 stakeTime,
        uint256 tipAmount,
        address payable author
    );

    event ImageTipped(
        uint256 id,
        string hash,
        string description,
        string longtitude,
        string latitude,
        string gender,
        uint256 stakeAmount,
        uint256 stakeTime,
        uint256 tipAmount,
        address payable author
    );

    constructor() {
        name = "Decentragram";
    }

    function uploadImage(
        string memory _imgHash,
        string memory description,
        string memory longtitude,
        string memory latitude,
        string memory gender,
        uint256 stakeAmount,
        uint256 stakeTime
    ) public {
        // Make sure the image hash exists
        require(bytes(_imgHash).length > 0, "iamge hash is empty");
        // Make sure image description exists
        require(bytes(description).length > 0, "description is empty");
        require(bytes(longtitude).length > 0, "longtitude is empty");
        require(bytes(latitude).length > 0, "latitude is empty");
        require(stakeAmount != 0, "stake amount cannot be 0");
        require(stakeTime != 0, "stake time cannot be 0");
        // Make sure uploader address exists
        require(msg.sender != address(0));

        // Increment image id
        imageCount++;

        // Add Image to the contract
        images[imageCount] = ImageLibrary.Image(
            imageCount,
            _imgHash,
            description,
            longtitude,
            latitude,
            gender,
            stakeAmount,
            stakeTime,
            0,
            payable(msg.sender)
        );
        // Trigger an event
        emit ImageCreated(imageCount, _imgHash, description,
            longtitude,
            latitude,
            gender,
            stakeAmount,
            stakeTime, 0, payable(msg.sender));
    }

    function tipImageOwner(uint256 _id) public payable {
        // Make sure the id is valid
        require(_id > 0 && _id <= imageCount);
        // Fetch the image
        ImageLibrary.Image memory _image = images[_id];
        // Fetch the author
        address payable _author = _image.author;
        // Pay the author by sending them Ether
        payable(_author).transfer(msg.value);
        // Increment the tip amount
        _image.tipAmount = _image.tipAmount + msg.value;
        // Update the image
        images[_id] = _image;
        // Trigger an event
        emit ImageTipped(
            _id,
            _image.hash,
            _image.description,
            _image.longtitude,
            _image.latitude,
            _image.gender,
            _image.stakeAmount,
            _image.stakeTime,
            _image.tipAmount,
            _author
        );
    }
}
