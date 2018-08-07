pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/token/ERC20/CappedToken.sol";

/**
 * CappedToken token is Mintable token with a max cap on totalSupply that can ever be minted.
 */
contract SHRToken is CappedToken {
    string public name = "SHARE EVERYTHING TOKEN";
    string public symbol = "SHR";
    uint256 public decimals = 18;
    uint256 public cap = 200000000 ether;

    /*------------------------------------constructor------------------------------------*/
    /**
    * @dev constructor for mesh token
    */
    constructor() CappedToken(cap) public {
    }
}
