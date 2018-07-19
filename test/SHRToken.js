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

  describe('pay', () => {

    /**
     * Scenario:
     * 1. Token contract is deployed successfully.
     * 2. Owner mints the token
     * 3. Transfer token from one account to another should not work.
     */
    it('should not allow pays by default', () => {
      return SHRToken.new().then(SHRToken => {
        return SHRToken.mint(accounts[0], 1000).then(() => {
          return SHRToken.pay(accounts[1], 1000).then(() => {
            return Promise.all([
              SHRToken.balanceOf(accounts[0]),
              SHRToken.balanceOf(accounts[1])
            ]).then(results => {
              assert.equal(results[0], 1000, 'sender account should still have its original balance');
              assert.equal(results[1], 0, 'receiver account should still be at 0');
            });
          });
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
            return SHRToken.pay(accounts[1], 1000).then(() => {
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
