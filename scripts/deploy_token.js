const generalSettings = require('../config/general-settings');
const addressConfig = require('../config/address-config');
const gasConfig = require('../config/gas-config');
const contracts = require('../utils/contracts');
const utils = require('../utils/utils');
const web3 = utils.getWeb3(generalSettings.host);

// Get token contract ABI and Bytecode
var tokenABI = contracts.getTokenABI();
var tokenBytecode = contracts.getTokenBytecode();

// Deploy token contract
var TokenContract = web3.eth.contract(tokenABI);
var TokenInstance = TokenContract.new({
        data: tokenBytecode, 
        from: addressConfig.ownerAddress, 
        gas: gasConfig.deployGas
    });

console.log("Token Contract is creating at: " + TokenInstance.transactionHash);