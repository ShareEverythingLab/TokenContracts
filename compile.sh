node_modules/.bin/truffle compile
node_modules/.bin/truffle-flattener contracts/SHRToken.sol > build/SHRToken.sol
node_modules/.bin/truffle-flattener contracts/SHROrder.sol > build/SHROrder.sol

