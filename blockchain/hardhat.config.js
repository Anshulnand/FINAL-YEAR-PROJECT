import '@nomicfoundation/hardhat-toolbox';

/** @type import('hardhat/config').HardhatUserConfig} */
const config = {
  solidity: '0.8.24',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts: ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80']
    },
    local8546: {
      url: 'http://127.0.0.1:8546'
    },
    local8547: {
      url: 'http://127.0.0.1:8547'
    }
  }
};

export default config;
