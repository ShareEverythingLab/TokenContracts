pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/CappedToken.sol';

/**
 * CappedToken token is Mintable token with a max cap on totalSupply that can ever be minted.
 * PausableToken overrides all transfers methods and adds a modifier to check if paused is set to false.
 */
contract SHRToken is CappedToken {
  string public name = "SHAREEVERYTHING TOKEN";
  string public symbol = "SHR";
  uint256 public decimals = 18;
  uint256 public cap = 200000000 ether;

  /*------------------------------------constructor------------------------------------*/
  /**
   * @dev constructor for mesh token
   */
  function SHRToken() CappedToken(cap) public {
  }
}
