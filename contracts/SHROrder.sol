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
        CancellationPolicyOption policyOption;
        AllocationStatus tokenAllocated;
        uint256 allocatedToFundPool;// amount to community fund allocation
        uint256 allocatedToPayable; // amount to accounts payable allocation
    }

    uint256 public lastOrderIndex = 0;
    Order[] private Orders;

    enum CancellationPolicyOption { 
        None,   // Undefined status
        Day,    // Allows cancel and full refund prior to 24hr of startTime
        Week,   // Allows cancel and full refund prior to 7 days of startTime
        Month   // Allows cancel and full refund prior to 30 days of startTime
    }
    enum AllocationStatus {
        Initiated,
        Cancelled,
        Holding,
        Released,
        Paid
    }

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
    function newOrder(
            address provider, 
            address consumer, 
            string recordId, 
            string itemId, 
            uint256 priceTotal, 
            uint256 startTime, 
            uint256 endTime
        ) public returns (uint256) 
    {
        
        // Creates new struct and saves in storage. We leave out the mapping type.
        Order memory order = Order(provider, consumer, recordId, itemId, priceTotal, startTime, endTime, CancellationPolicyOption.None, AllocationStatus.Initiated, 0, 0);
        Orders.push(order);
        lastOrderIndex = Orders.length.sub(1);
        bool transfered = token.transferFrom(consumer, address(this), priceTotal);
        if (transfered){
            fundsReceived(lastOrderIndex);
        }
        emit OrderCreated(lastOrderIndex, recordId);
        return lastOrderIndex;
    }
    
    function setCancellationPolicyOption(uint256 orderId, CancellationPolicyOption policyOptionId) public{
        Order storage o = Orders[orderId];
        require(checkOrderAndBalance(o, AllocationStatus.Holding) == true);
        require(o.policyOption == CancellationPolicyOption.None);

        o.policyOption = policyOptionId;
    }

    /**
    * @dev Cancel an Order in its HOLDING status 
    *  and refund all tokens 
    * @param orderId of this contract
    * @return boolean of success
    */
    function cancelHold(uint256 orderId) public returns (bool) {
        Order storage o = Orders[orderId];
        require(checkOrderAndBalance(o, AllocationStatus.Holding) == true);

        token.transfer(o.consumer, o.priceTotal);
        o.tokenAllocated = AllocationStatus.Cancelled;

        return true;
    }

    /**
    * @dev Cancel an Order after HOLD RELEASED 
    *  and refund according to cancellation policy 
    * @param orderId of this contract
    * @return boolean of success
    */
    function cancelOrder(uint256 orderId) public returns (bool) {
        Order storage o = Orders[orderId];
        require(o.tokenAllocated == AllocationStatus.Released);
        require(checkOrderCanCancel(o));
        uint256 amountToRefund = o.priceTotal.sub(o.allocatedToFundPool);
        require(token.balanceOf(address(this)) >= amountToRefund);

        token.transfer(o.consumer, amountToRefund);
        o.tokenAllocated = AllocationStatus.Cancelled;

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
        require(checkOrderAndBalance(o, AllocationStatus.Holding) == true);
        require(token.communityPool() != address(0));

        uint256 amountFund = o.priceTotal.mul(1).div(100);
        token.transfer(token.communityPool(), amountFund);
        o.allocatedToFundPool = amountFund;
        o.tokenAllocated = AllocationStatus.Released;

        return amountFund;
    }

    /**
    * @dev Transfer payable amount to provider
    * @param orderId of the Order
    * @return amount allocated to provider wallet
    */
    function payout(uint256 orderId) public returns (uint256) {
        Order storage o = Orders[orderId];
        uint256 amountPayable = o.priceTotal.sub(o.allocatedToFundPool);
        require(token.balanceOf(address(this)) >= amountPayable);

        token.transfer(o.provider, amountPayable);
        o.allocatedToPayable = amountPayable;
        o.tokenAllocated = AllocationStatus.Paid;

        return amountPayable;
    }

/** Order property getters */
/***************************/
    function getOrderTokenAllocationStatus(uint256 orderId) public view returns (AllocationStatus) {
        Order memory o = Orders[orderId];
        return o.tokenAllocated;
    }

    function getOrder(uint256 orderId) public view returns (address, address, string, string, uint256, uint256, uint256, AllocationStatus, uint256, uint256) {
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

    function getOrderCancellationPolicy(uint256 orderId) public view returns (CancellationPolicyOption) {
        Order memory o = Orders[orderId];
        return o.policyOption;
    }

/** Internal Functions */
/***********************/
    /**
    * @dev Internal func to set Order's tokenAllocated flag to 1
    * @param orderId of this contract
    */
    function fundsReceived(uint256 orderId) private {
        Order storage o = Orders[orderId];
        o.tokenAllocated = AllocationStatus.Holding;
    }

    /**
    * @dev Internal func to check Contract holds sufficient balance and Order is presumed status
    * @param order to check
    * @param tokenAllocationStatus required of the order to check
    * @return boolean
    */
    function checkOrderAndBalance(Order order, AllocationStatus tokenAllocationStatus) private view returns (bool) {
        require(order.tokenAllocated == tokenAllocationStatus);
        uint256 availableTokens = token.balanceOf(address(this));
        require (availableTokens >= order.priceTotal);
        return true;
    }

    /**
    * @dev Check if Order can be cancelled according to CancellationPolicyOption
    * @param order to check
    * @return boolean
    */
    function checkOrderCanCancel(Order order) private view returns (bool) {
        uint256 cancellationTimeRestraint = 0;
        if (order.policyOption == CancellationPolicyOption.None){
            cancellationTimeRestraint = 0;
        }
        else if (order.policyOption == CancellationPolicyOption.Day){
            cancellationTimeRestraint = 86400;
        }
        else if (order.policyOption == CancellationPolicyOption.Week){
            cancellationTimeRestraint = 604800;
        }
        else if (order.policyOption == CancellationPolicyOption.Month){
            cancellationTimeRestraint = 2592000;
        }
        else {
            return false;
        }
        // Order StartTime need to be after now + policy time
        require( order.startTime > (block.timestamp + cancellationTimeRestraint) );

        return true;
    }
}