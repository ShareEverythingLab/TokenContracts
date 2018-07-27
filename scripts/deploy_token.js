const generalSettings = require('../config/general-settings');
const addressConfig = require('../config/address-config');
const gasConfig = require('../config/gas-config');
const contracts = require('../utils/contracts');
const utils = require('../utils/utils');
const web3 = utils.getWeb3(generalSettings.host);

// Get token contract ABI and Bytecode
var tokenABI = contracts.getTokenABI();
var tokenBytecode = contracts.getTokenBytecode();

// Get order contract ABI and Bytecode
var orderABI = contracts.getOrderABI();
var orderBytecode = contracts.getOrderBytecode();

// Deploy token contract
var TokenContract = new web3.eth.Contract(tokenABI);
TokenContract.deploy({
    data: tokenBytecode
}).send({
    from: addressConfig.ownerAddress,
    gas: gasConfig.deployGas
}).then((TokenInstance) => {
    console.log("Token Contract is: " + TokenInstance.options.address);

    // Deploy order contract
    var OrderContract = new web3.eth.Contract(orderABI);
    OrderContract.deploy({
        data: orderBytecode,
        arguments: [TokenInstance.options.address]
    }).send({
        from: addressConfig.ownerAddress,
        gas: gasConfig.deployGas
    }).then((OrderInstance) => {
        console.log("Order Contract is: " + OrderInstance.options.address);
    });
});