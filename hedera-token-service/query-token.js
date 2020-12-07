'use strict'

require('dotenv').config();

const fs = require('fs');
const HederaClient = require('./hedera-client');
const { TokenInfoQuery, PrivateKey } = require('@hashgraph/sdk');
const { Instant, Duration } = require('js-joda');

async function querytokeninfo(tokenId) {
    try {
        const operatorAccount = process.env.ACCOUNT_ID;
        const operatorPrivateKey = PrivateKey.fromString(process.env.PRIVATE_KEY);
        const operatorPublicKey = operatorPrivateKey.publicKey;

        if (operatorPrivateKey == null || operatorAccount == null) {
            throw new Error(
                "environment variables OPERATOR_KEY and OPERATOR_ID must be present"
            );
        }

        let client = HederaClient;

        console.info(`Token ID: ${tokenId}\n`);

        // 토큰 정보를 질의한다.
        const tokenInfo = new TokenInfoQuery();
        tokenInfo.setTokenId(tokenId);

        const t = await tokenInfo.execute(client);
        console.info(`Token Symbol: ${t.symbol}, Token Name: ${t.name}`);
        console.info(`Total Supply: ${t.totalSupply}`);
        console.info(`Decimals: ${t.decimals}`);
        console.info(`Expiration Time: ${t.expirationTime.toDate()}`);
    } catch (err) {
        console.error(err);
    }
}

fs.readFile('/tmp/token_id', 'utf8', function (err, data) {
    let tokenId;

    if (err) {
        let args = process.argv.slice(2);

        if (args.length != 1) {
            console.error('Usage: node query-token.js {token ID}');
            process.exit(1);
        }

        tokenId = args[0];
        querytokeninfo(tokenId);
    } else {
        tokenId = data;
        querytokeninfo(tokenId);
    }
});