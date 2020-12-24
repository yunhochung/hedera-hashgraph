'use strict'

require('dotenv').config();

const fs = require('fs');
const HederaClient = require('./hedera-client');
const {
    AccountBalanceQuery,
    TokenDeleteTransaction,
    PrivateKey,
    Hbar,
    HbarUnit
} = require('@hashgraph/sdk');

async function deleteToken(tokenId) {
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

        // 토큰 밸런스를 확인한다.
        const query = new AccountBalanceQuery()
            .setAccountId(operatorAccount);
        let tokenBalance = await query.execute(client);
        console.log("The token balance(s) for account: " + tokenBalance.tokens + "\n");

        // 토큰을 삭제한다.
        await (await new TokenDeleteTransaction()
            .setTokenId(tokenId)
            .setMaxTransactionFee(new Hbar(100, HbarUnit.HBAR))
            .execute(client))
            .getReceipt(client);

        console.log(`Deleted token ${tokenId}\n`);

        tokenBalance = await query.execute(client);
        console.log("The token balance(s) for account: " + tokenBalance.tokens + "\n");
    } catch (err) {
        console.error(err);
    }
}

fs.readFile('/tmp/token_id', 'utf8', function (err, data) {
    let tokenId;

    if (err) {
        let args = process.argv.slice(2);

        if (args.length != 1) {
            console.error('Usage: node delete-token.js {token ID}');
            process.exit(1);
        }

        tokenId = args[0];
        deleteToken(tokenId);
    } else {
        tokenId = data;
        deleteToken(tokenId);
    }
});