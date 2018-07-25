const SHRToken = artifacts.require("SHRToken");

contract('SHRToken', (accounts) => {
  describe('constructor', () => {
    /**
     * Scenario:
     * 1. Token contract is deployed successfully.
     */
    it('should deploy', () => {
      return SHRToken.new().then(shrToken => {
        assert.isOk(shrToken.address, "Should have a valid address");
      });
    });
  });

  describe('communityPool', () => {
    /**
     * Scenario:
     * 1. Community pool address set and get
     */
    it('should set pool adddress', () => {
      return SHRToken.new().then(shrToken => {
        return shrToken.setCommunityPool(accounts[0]).then(() => {
          return shrToken.communityPool().then( _addr => {
            assert.equal(_addr, accounts[0], "Should set community pool address");
          });
        });
      });
    });
  });

  describe('transfer', () => {
    /**
     * Scenario:
     * 1. Token contract is deployed successfully.
     * 2. Owner mints the token
     * 3. Transfer token from one account to another should not work.
     */
    it('should allow pays by default', () => {
      return SHRToken.new().then(SHRToken => {
        return SHRToken.mint(accounts[0], 1000).then(() => {
          return SHRToken.transfer(accounts[1], 1000).then(() => {
              throw "transfer passed";
          })
          .catch(error => {
            assert.equal(error, 'transfer passed', 'should be allowed pays by default');
            return Promise.all([
              SHRToken.balanceOf(accounts[0]),
              SHRToken.balanceOf(accounts[1])
            ]).then(results => {
              assert.equal(results[0], 0, 'receiver account should have a balance of 0 now');
              assert.equal(results[1], 1000, 'sender account should have a balance of 1000 now');
            });
          })
        });
      });
    });
  });
});
