const SHRToken = artifacts.require("SHRToken");

contract('SHRToken', (accounts) => {
  describe('constructor', () => {
    /**
     * Scenario:
     * 1. Token contract is deployed successfully.
     */
    it('should deploy', () => {
      return SHRToken.new().then(SHRToken => {
        assert.isOk(SHRToken.address, "Should have a valid address");
      });
    });
  });

  describe('communityPool', () => {
    /**
     * Scenario:
     * 1. Community pool address set and get
     */
    it('should set pool adddress', () => {
      return SHRToken.new().then(SHRToken => {
        return SHRToken.setCommunityPool(address[1]).then(() => {
          assert.equal(SHRToken.getCommunityPool(), address[1], "Should set community pool address");
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
    it('should not allow pays by default', () => {
      return SHRToken.new().then(SHRToken => {
        return SHRToken.mint(accounts[0], 1000).then(() => {
          return SHRToken.transfer(accounts[1], 1000).then(() => {
              throw "should not be here";
          })
          .catch(error => {
            const invalidPay = error.message.search('should not be here') >= 0;
            assert.equal(invalidPay, false, 'should not be allowed pays by default');
            Promise.all([
              SHRToken.balanceOf(accounts[0]),
              SHRToken.balanceOf(accounts[1])
            ]).then(results => {
              assert.equal(results[0], 1000, 'sender account should have a balance of 1000 now');
              assert.equal(results[1], 0, 'receiver account should have a balance of 0 now');
            });
          })
        });
      });
    });

    /**
     * Scenario:
     * 1. Token contract is deployed successfully.
     * 2. Owner mints the tokens.
     * 3. Owner sets communityPool address.
     * 4. Transfer tokens from one account to another should work.
     */
    it('should allow transfers when community pool address was set', () => {
      return SHRToken.new().then(SHRToken => {
        return SHRToken.mint(accounts[0], 1000).then(() => {
          return SHRToken.setCommunityPool(accounts[2]).then(() => {
            return SHRToken.transfer(accounts[1], 1000).then(() => {
              return Promise.all([
                SHRToken.balanceOf(accounts[0]),
                SHRToken.balanceOf(accounts[1]),
                SHRToken.balanceOf(accounts[2])
              ]).then(results => {
                assert.equal(results[0], 0, 'sender account should have a balance of 0 now');
                assert.equal(results[1], 990, 'receiver account should have a balance of 990 now');
                assert.equal(results[2], 10, 'community pool account should have a balance of 10 now');
              });
            });
          });
        });
      });
    });
  });
});
