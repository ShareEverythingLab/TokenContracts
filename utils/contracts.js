const fs = require("fs");

const getJson = file => {
  const contents = fs.readFileSync(file);
  return JSON.parse(contents);
}

const tokenJsonFile = '../build/contracts/SHRToken.json';

const getTokenABI = () => {
  return getJson(tokenJsonFile).abi;
}

const getTokenBytecode= () => {
  return getJson(tokenJsonFile).bytecode;
}

module.exports = {
  getTokenABI,
  getTokenBytecode,
}