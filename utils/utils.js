const Web3 = require('web3');
const fs = require("fs");
const config = require('../config/general-settings');

const getWeb3 = host => new Web3(new Web3.providers.HttpProvider(host));
const web3 = getWeb3(config.host);

const convertEthToWei = n => web3.utils.toWei(n, 'ether');

const duration = {
  seconds: val => val,
  minutes: val => val * duration.seconds(60),
  hours: val => val * duration.minutes(60),
  days: val => val * duration.hours(24),
  weeks: val => val * duration.days(7),
  years: val => val * duration.days(365),
};

const getJson = file => {
  const contents = fs.readFileSync(file);
  return JSON.parse(contents);
}

const tokenJsonFile = '../build/contracts/SHRToken.json';

const getTokenContract = (_web3, contractAddress) => {
  const jsonContent = getJson(tokenJsonFile);
  return new _web3.eth.Contract(jsonContent.abi, contractAddress);
}

module.exports = {
  convertEthToWei,
  duration,
  getWeb3,
  getTokenContract,
}