const SHROrder = artifacts.require("SHROrder");
const SHRToken = artifacts.require("SHRToken");

contract('SHROrder', (accounts) => {
    const communityPool = accounts[0];
    const consumer = accounts[1];
    const provider = accounts[2];
    const recordId = 'r001';
    const itemId = 'i001';
    const priceTotal = 1110;
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
                return shrOrder.release(0).then(_released => {

                })
                .catch(err => {
                    assert('Should throw error when releasing empty order');
                });
            });
        });

        it('should not payout empty order', () => {
            return getContracts().then(({ shrOrder, shrToken }) => {
                return shrOrder.payout(0).then(_paid => {

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
                return shrToken.mint(consumer, priceTotal).then( () => {
                    const startTime = getCurrentTime();
                    const endTime = (startTime + 10000000);
                    return shrToken.approve(shrOrder.address, priceTotal, {from : consumer}).then( () => {
                        return shrOrder
                            .newOrder(provider, consumer, recordId, itemId, priceTotal, startTime, endTime)
                            .then(() => {
                                return shrOrder.lastOrderIndex().then(orderId => {
                                    assert.equal(orderId, 0, "Order should be created");
                                    return shrOrder.getOrderPriceTotal(orderId).then(total => {
                                        assert.equal(total, priceTotal, "Price total should match");
                                    })
                                });
                            });
                    });
                });
            });
        });
    });

    describe('order operations', () => {
        it('order can cancel', () => {
            return getContracts().then(({ shrOrder, shrToken }) => {
                return shrToken.mint(consumer, priceTotal).then( () => {
                    const startTime = (getCurrentTime());
                    const endTime = (startTime + 10000000);
                    return shrToken.approve(shrOrder.address, priceTotal, {from : consumer}).then( () => {
                        return shrOrder
                        .newOrder(provider, consumer, recordId, itemId, priceTotal, startTime, endTime).then(() => {
                            return shrToken.balanceOf(provider).then(originalBalance => {
                                return shrOrder.lastOrderIndex().then(orderId => {
                                    return shrOrder.cancelHold(orderId).then( () => {
                                        return Promise.all([
                                            shrOrder.getOrderTokenAllocationStatus(orderId),
                                            shrToken.balanceOf(consumer)
                                        ]).then( results => {
                                            assert.equal(results[0], 1, 'order status should be cancelled');
                                            assert.equal(results[1], priceTotal, 'consumer should have full refund');
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it('released order should allocate to fund', () => {
            return getContracts().then(({ shrOrder, shrToken }) => {
                return shrToken.mint(consumer, priceTotal).then( () => {
                    const startTime = getCurrentTime();
                    const endTime = (startTime + 10000000);
                    return shrToken.approve(shrOrder.address, priceTotal, {from : consumer}).then( () => {
                        return shrOrder
                            .newOrder(provider, consumer, recordId, itemId, priceTotal, startTime, endTime)
                            .then(() => {
                                return shrOrder.lastOrderIndex().then(orderId => {
                                    return shrOrder.release(orderId).then( () => {
                                        return shrOrder.getOrderAllocatedToFundPool(orderId).then(fund => {
                                            assert.equal(fund, Math.round(priceTotal / 100), "1% used for fund");
                                            return shrOrder.getOrderTokenAllocationStatus(orderId).then(status => {
                                                assert.equal(status, 3, 'order token status should be released');
                                                return shrToken.balanceOf(communityPool).then(poolBalance => {
                                                    assert.equal(poolBalance, Math.round(priceTotal / 100), 'pool should get 1%');
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                    });
                });
            });
        });

        it('payout order', () => {
            return getContracts().then(({ shrOrder, shrToken }) => {
                return shrToken.mint(consumer, priceTotal).then( () => {
                    const startTime = getCurrentTime();
                    const endTime = (startTime + 10000000);
                    return shrToken.approve(shrOrder.address, priceTotal, {from : consumer}).then( () => {
                        return shrOrder
                        .newOrder(provider, consumer, recordId, itemId, priceTotal, startTime, endTime).then(() => {
                            return shrOrder.lastOrderIndex().then(orderId => {
                                return shrOrder.release(orderId).then( () => {
                                    return shrOrder.payout(orderId).then( () => {
                                        return Promise.all([
                                            shrOrder.getOrderTokenAllocationStatus(orderId),
                                            shrToken.balanceOf(consumer),
                                            shrToken.balanceOf(provider),
                                            shrToken.balanceOf(communityPool)
                                        ]).then( results => {
                                            assert.equal(results[0], 4, 'order status should be paid out');
                                            assert.equal(results[1], 0, 'consumer should have used all tokens');
                                            assert.equal(results[2], Math.round(priceTotal/100*99), 'provider should have 99% tokens');
                                            assert.equal(results[3], Math.round(priceTotal/100), 'consumer should have 1% tokens');
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }); 
        });

        it('creates order with policy id and should cancel after approve', () => {
            return getContracts().then(({ shrOrder, shrToken }) => {
                return shrToken.mint(consumer, priceTotal).then( () => {
                    const startTime = getCurrentTime()+2592000; // after 1 month
                    const endTime = (startTime + 10000000);
                    return shrToken.approve(shrOrder.address, priceTotal, {from : consumer}).then( () => {
                        return shrOrder
                        .newOrder(provider, consumer, recordId, itemId, priceTotal, startTime, endTime).then(() => {
                            return shrOrder.lastOrderIndex().then(orderId => {
                                return shrOrder.setCancellationPolicyOption(orderId, 2).then( () => { // can cancell within 7 days
                                    return shrOrder.release(orderId).then( () => {
                                        return Promise.all([
                                            shrOrder.getOrderTokenAllocationStatus(orderId),
                                            shrToken.balanceOf(consumer),
                                            shrToken.balanceOf(communityPool),
                                            shrOrder.getOrderCancellationPolicy(orderId)
                                        ]).then( results => {
                                            assert.equal(results[0], 3, 'order status should be released');
                                            assert.equal(results[1], 0, 'consumer should have used all tokens');
                                            assert.equal(results[2], Math.round(priceTotal/100), 'consumer should have 1% tokens');
                                            assert.equal(results[3], 2);
                                            return shrOrder.cancelOrder(orderId).then( () => {
                                                return Promise.all([
                                                    shrOrder.getOrderTokenAllocationStatus(orderId),
                                                    shrToken.balanceOf(consumer),
                                                    shrToken.balanceOf(communityPool)
                                                ]).then( results => {
                                                    assert.equal(results[0], 1, 'order status should be cancelled');
                                                    assert.equal(results[1], Math.round(priceTotal/100*99), 'consumer should have 99% refund');
                                                    assert.equal(results[2], Math.round(priceTotal/100), 'Pool should have 1% tokens');
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        });
                    });
                });
            }); 
        });

        it('creates order with policy id and should not cancel after approve', () => {
            return getContracts().then(({ shrOrder, shrToken }) => {
                return shrToken.mint(consumer, priceTotal).then( () => {
                    const startTime = getCurrentTime();
                    const endTime = (startTime + 10000000);
                    return shrToken.approve(shrOrder.address, priceTotal, {from : consumer}).then( () => {
                        return shrOrder
                        .newOrder(provider, consumer, recordId, itemId, priceTotal, startTime, endTime).then(() => {
                            return shrOrder.lastOrderIndex().then(orderId => {
                                return shrOrder.setCancellationPolicyOption(orderId, 1).then( () => {
                                    return shrOrder.release(orderId).then( () => {
                                        return Promise.all([
                                            shrOrder.getOrderTokenAllocationStatus(orderId),
                                            shrToken.balanceOf(consumer),
                                            shrToken.balanceOf(communityPool),
                                            shrOrder.getOrderCancellationPolicy(orderId)
                                        ]).then( results => {
                                            assert.equal(results[0], 3, 'order status should be released');
                                            assert.equal(results[1], 0, 'consumer should have used all tokens');
                                            assert.equal(results[2], Math.round(priceTotal/100), 'consumer should have 1% tokens');
                                            assert.equal(results[3], 1, 'cancellation policy option should be 1');
                                            return shrOrder.cancelOrder(orderId).then( () => {
                                                assert.equal(true, false, 'cancel order should not succeed');
                                                throw 'failed to cancel';
                                            }).catch(error => {
                                                return Promise.all([
                                                    shrOrder.getOrderTokenAllocationStatus(orderId),
                                                    shrToken.balanceOf(consumer),
                                                    shrToken.balanceOf(communityPool)
                                                ]).then( results => {
                                                    console.log("OrderStatus:"+results[0]);
                                                    console.log("ConsumerFund:"+results[1]);
                                                    console.log("PoolFund:"+results[2]);
                                                    assert.equal(results[0], 3, 'order status should not be able to cancelled due to time restraint');
                                                    assert.equal(results[1], 0, 'consumer should have no refund');
                                                    assert.equal(results[2], Math.round(priceTotal/100), 'consumer should have 1% tokens');
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        });
                    });
                });
            }); 
        });
    })
});