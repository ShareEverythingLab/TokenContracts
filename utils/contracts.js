const fs = require("fs");

const getJson = file => {
  const contents = fs.readFileSync(file);
  return JSON.parse(contents);
}

const tokenJsonFile = '../build/contracts/SHRToken.json';
const orderJsonFile = '../build/contracts/SHROrder.json';

const getTokenABI = () => {
  return getJson(tokenJsonFile).abi;
}


const getTokenBytecode= () => {
  return getJson(tokenJsonFile).bytecode;
}

const getOrderABI = () => {
  return getJson(orderJsonFile).abi;
}
const getOrderBytecode= () => {
  return getJson(orderJsonFile).bytecode;
}

module.exports = {
  getTokenABI,
  getTokenBytecode,
  getOrderABI,
  getOrderBytecode,
}