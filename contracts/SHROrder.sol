pragma solidity ^0.4.24;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import "zeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "./SHRToken.sol";

contract SHROrder is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Basic;

    SHRToken public token;

    event OrderCreated(uint orderId, string recordId);

    struct Order {
        address provider;
        address consumer;
        string recordId;
        string itemId;
        uint256 priceTotal;
        uint256 startTime;
        uint256 endTime;
        int8 tokenAllocated; // -1 = cancelled, 0 = none, 1 = received & holding, 2 = holding released, 3 = paid out
        uint256 allocatedToFundPool; // community fund allocation, record when transfer is made
        uint256 allocatedToPayable; // accounts payable allocation, record when transfer is made
    }

    uint256 public lastOrderIndex = 0;
    Order[] private Orders;

    constructor(SHRToken _tokenContract) public {
        // storing constructor
        token = _tokenContract;
    }

    function totalOrders() public view returns (uint256) {
        return Orders.length;
    }

    /**
    * @dev Create new Order
    * @param provider address of service or goods provider
    * @param consumer address of product customer
    * @param recordId as DAPP Order ID
    * @param itemId as DAPP product ID
    * @param priceTotal in wei of total amount of transaction
    * @param startTime of the service
    * @param endTime of the service
    * @return uint orderId of this contract
    */
    function newOrder(address provider, address consumer, string recordId, string itemId, uint256 priceTotal, uint256 startTime, uint256 endTime) public returns (uint256) {
        // Creates new struct and saves in storage. We leave out the mapping type.
        Order memory order = Order(provider, consumer, recordId, itemId, priceTotal, startTime, endTime, 0, 0, 0);
        Orders.push(order);
        lastOrderIndex = Orders.length.sub(1);
        bool transfered = token.transferFrom(consumer, address(this), priceTotal);
        if (transfered){
            fundsReceived(lastOrderIndex);
        }
        emit OrderCreated(lastOrderIndex, recordId);
        return lastOrderIndex;
    }

    /**
    * @dev set Order's tokenAllocated flag to 1
    * @param orderId of this contract
    */
    function fundsReceived(uint orderId) private {
        Order storage o = Orders[orderId];
        o.tokenAllocated = 1;
    }

    /**
    * @dev Cancel an Order and refund all tokens 
    * @param orderId of this contract
    * @return boolean of success
    */
    function cancel(uint256 orderId) public returns (bool) {
        Order storage o = Orders[orderId];
        require(checkOrderAndBalance(o, 1) == true);

        token.transfer(o.consumer, o.priceTotal);
        o.tokenAllocated = -1;

        return true;
    }

    /**
    * @dev Order is confirmed. 
    * Send ~1% to fund community pool, 99~% to fund account payable
    * @param orderId of this contract
    * @return amount allocated to community pool fund
    */
    function release(uint256 orderId) public returns (uint256) {
        Order storage o = Orders[orderId];
        require(checkOrderAndBalance(o, 1) == true);
        require(token.communityPool() != address(0));

        uint256 amountFund = o.priceTotal.mul(1).div(100);
        token.transfer(token.communityPool(), amountFund);
        o.allocatedToFundPool = amountFund;
        o.tokenAllocated = 2;

        return amountFund;
    }

    function payout(uint256 orderId) public returns (uint256) {
        Order storage o = Orders[orderId];
        uint256 amountPayable = o.priceTotal.sub(o.allocatedToFundPool);
        require(token.balanceOf(address(this)) >= amountPayable);

        token.transfer(o.provider, amountPayable);
        o.allocatedToPayable = amountPayable;
        o.tokenAllocated = 3;

        return amountPayable;
    }

    function checkOrderAndBalance(Order order, int8 tokenAllocationStatus) private view returns (bool) {
        require(order.tokenAllocated == tokenAllocationStatus);
        uint256 availableTokens = token.balanceOf(address(this));
        require (availableTokens >= order.priceTotal);
        return true;
    }

    function getOrderTokenAllocationStatus(uint256 orderId) public view returns (int8) {
        Order memory o = Orders[orderId];
        return o.tokenAllocated;
    }

    function getOrder(uint256 orderId) public view returns (address, address, string, string, uint256, uint256, uint256, int8, uint256, uint256) {
        Order memory o = Orders[orderId];
        return (o.provider, o.consumer, o.recordId, o.itemId, o.priceTotal, o.startTime, o.endTime, o.tokenAllocated, o.allocatedToFundPool, o.allocatedToPayable);
    }

    function getOrderPriceTotal(uint256 orderId) public view returns (uint256) {
        Order memory o = Orders[orderId];
        return o.priceTotal;
    }

    function getOrderAllocatedToFundPool(uint256 orderId) public view returns (uint256) {
        Order memory o = Orders[orderId];
        return o.allocatedToFundPool;
    }
}