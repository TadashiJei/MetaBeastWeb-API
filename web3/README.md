# MetaBeast Web3 Integration

This module provides Web3 integration for the MetaBeast API, allowing users to connect their MetaMask wallets and interact with the Core blockchain.

## Features

- **MetaMask Wallet Connection**: Connect MetaMask wallets to user accounts
- **Signature Verification**: Verify wallet ownership through cryptographic signatures
- **Connection Management**: Store and manage wallet connections in MongoDB
- **Removal Request System**: Process for users to request wallet disconnection
- **Admin Approval Workflow**: Admin interface for reviewing and processing removal requests
- **Email Notifications**: Notifications for connection and disconnection events
- **Core Blockchain Integration**: Direct integration with Core blockchain (mainnet and testnet)

## API Endpoints

### User Endpoints

- `GET /api/metamask/nonce` - Request a nonce for MetaMask signature
- `POST /api/metamask` - Connect a MetaMask wallet
- `GET /api/metamask` - Get user's MetaMask connections
- `POST /api/metamask/removal-request` - Request removal of a MetaMask connection
- `GET /api/metamask/:walletAddress/balance` - Get wallet balance

### Admin Endpoints

- `GET /api/admin/metamask/stats` - Get dashboard stats
- `GET /api/admin/metamask/removal-requests` - Get all pending removal requests
- `POST /api/admin/metamask/removal-requests/process` - Process a removal request
- `GET /api/admin/metamask/connections` - Get all MetaMask connections
- `GET /api/admin/metamask/connections/:walletAddress/history` - Get connection history
- `DELETE /api/admin/metamask/connections` - Force remove a connection

## Configuration

The Web3 integration can be configured in the main `config.js` file:

```javascript
// Web3 Configuration
web3_enabled: true,       // Enable Web3 functionality
web3_use_testnet: true,   // Use Core testnet instead of mainnet
web3_core_rpc_mainnet: "https://rpc.coredao.org",
web3_core_rpc_testnet: "https://rpc.test.btcs.network",
web3_admin_approval_required: true,  // Require admin approval for wallet disconnection
web3_auto_connect_verified_users: false,  // Auto-connect verified users to their wallets
```

## Dependencies

- web3: ^1.9.0
- ethers: ^5.7.2

## Database Schema

The MetaMask connections are stored in the `MetaMaskConnections` collection with the following schema:

- `walletAddress`: Ethereum address (unique, indexed)
- `userId`: User ID (indexed)
- `connectionTime`: When the wallet was first connected
- `lastUsed`: When the wallet was last used
- `nonce`: Random nonce for signature verification
- `chainId`: Blockchain network ID
- `removalRequest`: Object containing removal request details
  - `status`: Status of the removal request (none, pending, approved, rejected)
  - `requestTime`: When the removal was requested
  - `reason`: Reason for removal
  - `email`: Contact email for notifications
  - `adminNotes`: Notes from admin during processing
  - `processedBy`: Admin who processed the request
  - `processedTime`: When the request was processed

## Security Considerations

- All wallet addresses are stored in lowercase to prevent case-sensitivity issues
- Signatures are verified using industry-standard cryptographic methods
- Admin approval is required for wallet disconnection to prevent unauthorized removal
- Email notifications are sent for important actions
- Role-based access control for admin functions

## Implementation Details

The Web3 integration is implemented as a separate module to maintain clean separation of concerns. It consists of:

1. **Models**: Database schemas for storing MetaMask connections
2. **Controllers**: Business logic for handling requests
3. **Routes**: API endpoints for user and admin interactions
4. **Services**: Core Web3 functionality and blockchain interactions
5. **Tools**: Middleware and utility functions

This modular approach allows for easy maintenance and future expansion of Web3 capabilities.
