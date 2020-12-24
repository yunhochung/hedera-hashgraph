'use strict'

require('dotenv').config();

const fs = require('fs');
const HederaClient = require('./hedera-client');
const {
    AccountBalanceQuery, TokenGrantKycTransaction, AccountCreateTransaction, TransferTransaction, PrivateKey, Hbar, HbarUnit, TokenAssociateTransaction
} = require('@hashgraph/sdk');

async function transferToken(tokenId) {
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
            .setAccountId(operatorAccount);
        const tokenBalance = await query.execute(client);
        console.log("The token balance(s) for operator account: " + tokenBalance.tokens + "\n");

        // 수신 계정을 생성한다.
        const newKey = PrivateKey.generate();

        console.log('* new account')
        console.log(`private key = ${newKey}`);
        console.log(`public key = ${newKey.publicKey}`);

        let resp = await new AccountCreateTransaction()
            .setKey(newKey.publicKey)
            .setInitialBalance(new Hbar(50, HbarUnit.HBAR))
            .execute(client);

        const transactionReceipt = await resp.getReceipt(client);
        const newAccountId = transactionReceipt.accountId;

        console.log(`new account ID = ${newAccountId}\n`);

        // 수신 계정이 토큰을 사용할 수 있도록 연결한다.
        await (await (await new TokenAssociateTransaction()
            .setAccountId(newAccountId)
            .setTokenIds([tokenId])
            .setMaxTransactionFee(new Hbar(100, HbarUnit.HBAR))
            .freezeWith(client)
            .sign(newKey))
            .execute(client))
            .getReceipt(client);

        console.log(`Associated account ${newAccountId} with token ${tokenId}`);

        await (await new TokenGrantKycTransaction()
            .setAccountId(newAccountId)
            .setTokenId(tokenId)
            .setMaxTransactionFee(new Hbar(100, HbarUnit.HBAR))
            .execute(client))
            .getReceipt(client);

        console.log(`Granted KYC for account ${newAccountId} on token ${tokenId}\n`);

        await (await new TransferTransaction()
            .addTokenTransfer(tokenId, client.operatorAccountId, -10)
            .addTokenTransfer(tokenId, newAccountId, 10)
            .setMaxTransactionFee(new Hbar(100, HbarUnit.HBAR))
            .execute(client))
            .getReceipt(client);

        console.log(`Sent 10 tokens from account ${client.operatorAccountId} to account ${newAccountId} on token ${tokenId}`);

        fs.writeFileSync('/tmp/new_account', newAccountId, { encoding: 'utf8', flag: 'w' });
    } catch (err) {
        console.error(err);
    }
}

fs.readFile('/tmp/token_id', 'utf8', function (err, data) {
    let tokenId;

    if (err) {
        let args = process.argv.slice(2);

        if (args.length != 1) {
            console.error('Usage: node transfer-token.js {token ID}');
            process.exit(1);
        }

        tokenId = args[0];
        transferToken(tokenId);
    } else {
        tokenId = data;
        transferToken(tokenId);
    }
});