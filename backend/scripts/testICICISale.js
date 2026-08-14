import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { generateICICIHash } from '../utils/iciciHash.js';

const runTest = async () => {
  const merchantTxnNo = `RE${Date.now().toString().slice(-8)}001`;
  const txnDate = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

  const hashPayload = {
    merchantId: process.env.ICICI_MERCHANT_ID,
    aggregatorID: 'A100000000007164',
    merchantTxnNo,
    amount: "100.00",
    currencyCode: "356",
    payType: "0",
    customerEmailID: "guest@icici.com",
    transactionType: "SALE",
    returnURL: `http://localhost:${process.env.PORT || 5001}/api/payment/icici/response`,
    txnDate: txnDate,
    customerMobileNo: "9876543210",
    customerName: "TestUser",
    addlParam1: "ABCD",
    addlParam2: "111",
  };

  const secureHash = generateICICIHash(hashPayload, process.env.ICICI_HASH_KEY);

  const requestPayload = {
    ...hashPayload,
    secureHash
  };

  try {
    const response = await axios.post(process.env.ICICI_SALE_URL, requestPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log("ICICI RESPONSE CODE:", response.data.responseCode);
    console.log("ICICI RESPONSE DESCRIPTION:", response.data.responseDescription || response.data.respDescription);
    if (response.data.redirectURI) {
      console.log("Got Redirect URI. Test Passed.");
    }
  } catch (error) {
    console.error("HTTP ERROR:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
};

runTest();
