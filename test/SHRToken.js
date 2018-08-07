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
});
