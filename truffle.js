module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 3, // Ropsten network id
      from: "", //account for deoployment
      gas: 4000000
    }   
  }
};
