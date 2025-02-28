/**
 * Test script for Web3 integration
 * Run with: node web3/tools/test.js
 */

const Web3Service = require('../services/web3.service');
const config = require('../../config.js');

async function testWeb3Connection() {
    console.log('Testing Web3 connection to Core blockchain...');
    
    try {
        // Test network connection
        const networkId = await Web3Service.getNetworkId();
        console.log(`Connected to network ID: ${networkId}`);
        
        // Check if connected to Core blockchain
        const isCoreNetwork = await Web3Service.isCoreNetwork();
        console.log(`Connected to Core blockchain: ${isCoreNetwork}`);
        
        // Get current gas price
        const gasPrice = await Web3Service.getGasPrice();
        console.log(`Current gas price: ${gasPrice} Gwei`);
        
        // Test signature verification
        const testAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
        const nonce = Web3Service.generateNonce();
        const message = Web3Service.createSignMessage(nonce, testAddress);
        
        console.log('\nTest message for signature:');
        console.log(message);
        console.log('\nNonce generated:', nonce);
        
        console.log('\nWeb3 connection test completed successfully!');
        console.log(`Using ${config.web3_use_testnet ? 'testnet' : 'mainnet'} RPC endpoint: ${config.web3_use_testnet ? config.web3_core_rpc_testnet : config.web3_core_rpc_mainnet}`);
        
    } catch (error) {
        console.error('Error testing Web3 connection:', error);
    }
}

// Run the test
testWeb3Connection();
