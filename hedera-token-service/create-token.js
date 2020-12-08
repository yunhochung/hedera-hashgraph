'use strict'

require('dotenv').config();

const fs = require('fs');
const HederaClient = require('./hedera-client');
const { TokenCreateTransaction, PrivateKey, Hbar, Timestamp } = require('@hashgraph/sdk');
const { Instant, Duration } = require('js-joda');

async function createToken() {
  try {
    const operatorAccount = process.env.ACCOUNT_ID;
    const operatorPrivateKey = PrivateKey.fromString(process.env.PRIVATE_KEY);
    const operatorPublicKey = operatorPrivateKey.publicKey;

    if (operatorPrivateKey == null || operatorAccount == null) {
      throw new Error(
        'environment variables OPERATOR_KEY and OPERATOR_ID must be present'
      );
    }

    let client = HederaClient;

    // 토큰을 생성한다.
    let resp = await new TokenCreateTransaction()
      .setTokenName('YH TOKEN') // 토큰명
      .setTokenSymbol('YH') // 토큰 심볼명
      .setTreasuryAccountId(client.operatorAccountId)
      .setExpirationTime(Timestamp.fromDate(Instant.now().plus(Duration.ofDays(90)).toString())) // 만기일. 90일후
      .setInitialSupply(1000000)
      .setDecimals(0)
      .setKycKey(client.operatorPublicKey)
      .setWipeKey(client.operatorPublicKey)
      .setAdminKey(client.operatorPublicKey) // 토큰 삭제시 필요. 미설정시 IMMUTABLE (NFT)

      // .setAdminKey(client.operatorPublicKey)
      // .setFreezeKey(client.operatorPublicKey)
      // .setSupplyKey(client.operatorPublicKey)
      // .setFreezeDefault(false)
      // .setMaxTransactionFee(new Hbar(1000))
      // .setAutoRenewPeriod(Duration.ofDays(90))

      .execute(client);


    const tokenId = (await resp.getReceipt(client)).tokenId;

    console.log('The new token ID is ' + tokenId);

    // 차후 사용하기 위해 토큰 ID를 파일로 저장
    fs.writeFileSync('/tmp/token_id', tokenId, { encoding: 'utf8', flag: 'w' });
  } catch (err) {
    console.error(err);
  }

}

createToken();