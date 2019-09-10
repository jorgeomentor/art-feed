pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

contract ArtFeed{
    struct ArtObject{
        uint id;
        address artist;
        address owner;
        bytes artData;
    }
    
    address owner;
    uint countID;
    mapping (uint => address) artOwner;
    mapping (uint => address) artArtist;
    mapping (uint => bytes) artData;
    mapping (uint => bytes[]) artHistoryData;

    modifier onlyArtOwner(uint artId){
        require(msg.sender == artOwner[artId]);
        _;
    }
    
    event newArtEvent(uint artId, address artist);

    function newArt(bytes memory _artData) public {
        artOwner[countID] = msg.sender;
        artArtist[countID] = msg.sender;
        artData[countID] = _artData;
        emit newArtEvent(countID, msg.sender);
        countID += 1;
    }

    function newHistory(uint _artId, bytes memory _historyData) public onlyArtOwner(_artId){
        artHistoryData[_artId].push(_historyData);
    }
    
    event changeOwnerArt(uint indexed artId, address newOwner);
    
    function transferArt(uint _artId, address _newOwner) public onlyArtOwner(_artId){
        artOwner[_artId] = _newOwner;
        emit changeOwnerArt(_artId, _newOwner);
    }
    
    function getArt(uint _artId) public view returns(address owner, bytes memory, address artist){
        return( artOwner[_artId], artData[_artId], artArtist[_artId]);
    }

    function getArtHistory(uint _artId) public view returns(bytes[] memory){
        return artHistoryData[_artId];
    }
      
     function getArtObjects()public view returns(ArtObject[] memory){
        ArtObject[] memory result = new ArtObject[](countID);
        for(uint i = 0; i < countID; i++) {
            result[i].id = i;
            result[i].owner = artOwner[i];
            result[i].artData = artData[i];
            result[i].artist = artArtist[i];
        }
        return result;
    }
    
}