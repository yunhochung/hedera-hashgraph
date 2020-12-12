require('dotenv').config();
const { Client } = require('@hashgraph/sdk');

const HederaClient = new Client({
    // Testnet Proxy BY YH
    network: { '13.124.85.3:80': '0.0.3' },
    // network: { '0.testnet.hedera.com:50211': '0.0.3' },

    // Previewnet
    // network: { '35.231.208.148:50211': '0.0.3'},
    operator: {
        accountId: process.env.ACCOUNT_ID,
        privateKey: process.env.PRIVATE_KEY
    }
});

module.exports = HederaClient;