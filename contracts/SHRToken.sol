pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/token/ERC20/CappedToken.sol";

/**
 * CappedToken token is Mintable token with a max cap on totalSupply that can ever be minted.
 * PausableToken overrides all transfers methods and adds a modifier to check if paused is set to false.
 */
contract SHRToken is CappedToken {
    using SafeMath for uint256;
    string public name = "SHAREEVERYTHING TOKEN";
    string public symbol = "SHR";
    uint256 public decimals = 18;
    uint256 public cap = 200000000 ether;
    address private communityPool;

    /*------------------------------------constructor------------------------------------*/
    /**
    * @dev constructor for mesh token
    */
    constructor() CappedToken(cap) public {
    }

    function setCommunityPool(address _pool) external onlyOwner {
        require(_pool != address(0));
        communityPool = _pool;
    }

    function getCommunityPool() public returns (address) {
        return communityPool;
    }
}
