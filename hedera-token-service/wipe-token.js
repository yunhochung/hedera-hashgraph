'use strict'

require('dotenv').config();

const fs = require('fs');
const HederaClient = require('./hedera-client');
const {
    AccountBalanceQuery,
    TokenWipeTransaction,
    PrivateKey
} = require('@hashgraph/sdk');

async function wipeToken(tokenId, accountId) {
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

        // 오퍼레이터 계정에서 사용중인 토큰 밸런스를 확인한다.
        const query = new AccountBalanceQuery()
            .setAccountId(accountId);
        let tokenBalance = await query.execute(client);
        console.log("The token balance(s) for new account: " + tokenBalance.tokens + "\n");

        await (await new TokenWipeTransaction()
            .setTokenId(tokenId)
            .setAccountId(accountId)
            .setAmount(10)
            .execute(client))
            .getReceipt(client);

        console.log(`Wiped balance of account ${accountId}\n`);

        tokenBalance = await query.execute(client);
        console.log("The token balance(s) for new account: " + tokenBalance.tokens + "\n");
    } catch (err) {
        console.error(err);
    }
}

fs.readFile('/tmp/token_id', 'utf8', function (err, data) {
    let tokenId;
    let accountId;

    if (err) {
        let args = process.argv.slice(2);

        if (args.length != 2) {
            console.error('Usage: node wipe-token.js {token ID} {account ID}');
            process.exit(1);
        }

        tokenId = args[0];
        accountId = args[1];
        wipeToken(tokenId, accountId);
    } else {
        tokenId = data;

        fs.readFile('/tmp/new_account', 'utf8', function (err, data) {
            accountId = data;
            wipeToken(tokenId, accountId);
        });
    }
});