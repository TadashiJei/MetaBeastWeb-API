const Web3 = require('web3');
const ethers = require('ethers');
const crypto = require('crypto');
const config = require('../../config.js');

// Core blockchain RPC endpoints
const CORE_MAINNET_RPC = 'https://rpc.coredao.org';
const CORE_TESTNET_RPC = 'https://rpc.test.btcs.network';

// Initialize Web3 with the appropriate network
const web3 = new Web3(new Web3.providers.HttpProvider(
    config.web3_use_testnet ? CORE_TESTNET_RPC : CORE_MAINNET_RPC
));

// Initialize ethers provider
const ethersProvider = new ethers.providers.JsonRpcProvider(
    config.web3_use_testnet ? CORE_TESTNET_RPC : CORE_MAINNET_RPC
);

/**
 * Generate a random nonce for MetaMask signature verification
 */
exports.generateNonce = () => {
    return crypto.randomBytes(16).toString('hex');
};

/**
 * Verify a MetaMask signature
 * @param {string} address - Ethereum address
 * @param {string} message - Message that was signed
 * @param {string} signature - Signature to verify
 * @returns {boolean} - Whether the signature is valid
 */
exports.verifySignature = (address, message, signature) => {
    try {
        // Recover the address from the signature
        const msgBuffer = Buffer.from(message);
        const msgHash = ethers.utils.hashMessage(msgBuffer);
        const msgHashBytes = ethers.utils.arrayify(msgHash);
        const recoveredAddress = ethers.utils.recoverAddress(msgHashBytes, signature);
        
        // Compare the recovered address with the provided address
        return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
};

/**
 * Get the current Core blockchain network ID
 */
exports.getNetworkId = async () => {
    try {
        return await web3.eth.net.getId();
    } catch (error) {
        console.error('Error getting network ID:', error);
        throw error;
    }
};

/**
 * Get Core token balance for an address
 * @param {string} address - Ethereum address
 * @returns {string} - Balance in Core tokens
 */
exports.getBalance = async (address) => {
    try {
        const balanceWei = await web3.eth.getBalance(address);
        return web3.utils.fromWei(balanceWei, 'ether');
    } catch (error) {
        console.error('Error getting balance:', error);
        throw error;
    }
};

/**
 * Get transaction count for an address
 * @param {string} address - Ethereum address
 * @returns {number} - Transaction count
 */
exports.getTransactionCount = async (address) => {
    try {
        return await web3.eth.getTransactionCount(address);
    } catch (error) {
        console.error('Error getting transaction count:', error);
        throw error;
    }
};

/**
 * Create a message for signing
 * @param {string} nonce - Random nonce
 * @param {string} userId - User ID
 * @returns {string} - Message to sign
 */
exports.createSignMessage = (nonce, userId) => {
    return `Welcome to MetaBeast!\n\nClick to sign in and accept the MetaBeast Terms of Service.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n${userId}\n\nNonce:\n${nonce}`;
};

/**
 * Get the current gas price
 * @returns {string} - Gas price in Gwei
 */
exports.getGasPrice = async () => {
    try {
        const gasPriceWei = await web3.eth.getGasPrice();
        return web3.utils.fromWei(gasPriceWei, 'gwei');
    } catch (error) {
        console.error('Error getting gas price:', error);
        throw error;
    }
};

/**
 * Check if the connected network is Core blockchain
 * @returns {boolean} - Whether connected to Core blockchain
 */
exports.isCoreNetwork = async () => {
    try {
        const networkId = await this.getNetworkId();
        // Core Mainnet ID is 1116, Testnet is 1115
        return networkId === 1116 || networkId === 1115;
    } catch (error) {
        console.error('Error checking network:', error);
        return false;
    }
};

// Export the web3 instance for direct use if needed
exports.web3 = web3;
exports.ethersProvider = ethersProvider;
