const generalSettings = require('../config/general-settings');
const addressConfig = require('../config/address-config.js');
const gasConfig = require('../config/gas-config');
const utils = require('../utils/utils');

const web3 = utils.getWeb3(generalSettings.host);

// instantiate contract
var TokenInstance = utils.getTokenContract(
  web3,
  addressConfig.tokenAddress
);

// mintPredefinedTokens
web3.eth.defaultAccount = addressConfig.ownerAddress;
const mintingConfig = require('../config/minting-config')

for (let i = 0; i < mintingConfig.length; i++) {
    const txHash = TokenInstance.mint(
        mintingConfig[i].address, 
        utils.convertEthToWei(mintingConfig[i].tokenAmountETH)
    );
    console.log(`txHash: ${txHash}`);
}