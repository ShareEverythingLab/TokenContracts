const SHRToken = artifacts.require("SHRToken");
const SHROrder = artifacts.require("SHROrder");


contract('SHROrder', (accounts) => {

    describe('constructor', () => {
      /**
       * Scenario:
       * 1. Token contract is deployed successfully.
       */
      it('should deploy', () => {
        return SHROrder.new().then(SHROrder => {
          assert.isOk(SHROrder.address, "Should have a valid address");
        });
      });
    });

});