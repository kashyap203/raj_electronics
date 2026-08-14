import crypto from 'crypto';

const sampleParams = {
  "merchantId": "T_S00067",
  "merchantTxnNo": "Test03102025111",
  "amount": "550.00",
  "currencyCode": "356",
  "payType": "0",
  "customerEmailID": "guest@icici.com",
  "transactionType": "SALE",
  "returnURL": "https://pgpayuat.icicibank.com/tsp/pg/api/merchant",
  "txnDate": "20251003123421",
  "customerMobileNo": "7912403781",
  "addlParam1": "Additional Information",
  "addlParam2" : "Additional Information"
};

const secretKey = 'your_hash_key'; // We don't have the UAT key for this sample? 
// Wait, do we know the key for the sample? No. So I can't check the hash.

console.log("Cannot test without key");
