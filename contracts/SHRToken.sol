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
    address public communityPool;
    uint256 public decimals = 18;
    uint256 public cap = 200000000 ether;

    /*------------------------------------constructor------------------------------------*/
    /**
    * @dev constructor for mesh token
    */
    constructor() CappedToken(cap) public {
    }

    /**
    * @dev overriding transfer method to include the onlyPayloadSize check modifier
    */
    function pay(address _to, uint256 _value) public returns (bool) {
        require(communityPool != address(0));
        uint256 fund = _value.mul(1).div(100);
        uint256 amnt = _value.mul(99).div(100);
        return transfer(_to, amnt) && transfer(communityPool, fund);
    }

    function setCommunityPool(address _pool) external onlyOwner {
        require(_pool != address(0));
        communityPool = _pool;
    }
}
