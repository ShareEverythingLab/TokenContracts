const SHROrder = artifacts.require("SHROrder");
const SHRToken = artifacts.require("SHRToken");

contract('SHROrder', (accounts) => {
    const communityPool = accounts[0];
    const consumer = accounts[1];
    const provider = accounts[2];
    const recordId = 'r001';
    const itemId = 'i001';
    const priceTotal = 10000;
    const getCurrentTime = () => Math.floor(Date.now() / 1000);
    const getContracts = () => {
        /**
         * Contract deployment order:
         * 1. Deploy token contract first.
         * 2. then deploy order contract.
         * 3. Transfer ownership of token contract to crowdsale contract.
         */
        return SHRToken.new().then(shrToken => {
            shrToken.setCommunityPool(communityPool);
            const deployOrder = () => {
                return SHROrder.new(shrToken.address);
            };
            return deployOrder().then(shrOrder => {
                return { shrOrder, shrToken };
            });
        });
    }

    describe('constructor', () => {
        it('should set defaults in constructor', () => {
            return getContracts().then(({ shrOrder, shrToken }) => {
                return Promise.all([
                    shrOrder.token(),
                ]).then(results => {
                    assert.equal(results[0], shrToken.address, "Token should match the passed params");
                });
            });
        });
    });

    describe('newOrder', () => {
        it('should not release empty order', () => {
            return getContracts().then(({ shrOrder, shrToken }) => {
                shrOrder.release(0).then(_released => {

                })
                .catch(err => {
                    assert('Should throw error when releasing empty order');
                });
            });
        });

        it('should not payout empty order', () => {
            return getContracts().then(({ shrOrder, shrToken }) => {
                shrOrder.payout(0).then(_paid => {

                })
                .catch(err => {
                    assert('Should throw error when payout empty order');
                });
            });
        });

        /**
         * Scenario:
         * 1. Create a new Order in Order contract.
         */
        it('should create order', () => {
            return getContracts().then(({ shrOrder, shrToken }) => {
                shrToken.mint(consumer, priceTotal).then( () => {
                    const startTime = getCurrentTime();
                    const endTime = (startTime + 10000000);
                    shrToken.approve(shrOrder.address, priceTotal, {from : consumer}).then( () => {
                        shrOrder
                            .newOrder(provider, consumer, recordId, itemId, priceTotal, startTime, endTime)
                            .then(() => {
                                shrOrder.numOrders().then(orderId => {
                                assert.equal(orderId, 1, "Order should be created");
                                });
                            });
                    });
                });
            });
        });

    });

});