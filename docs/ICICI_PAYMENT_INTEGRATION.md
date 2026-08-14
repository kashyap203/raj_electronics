# ICICI Bank Orange Payment Gateway Integration

This document describes the architecture, payment flows, and integration details for the ICICI Bank Orange PG on the Raj Electronics e-commerce platform.

## 1. Architecture & Payment Flow

The integration uses the **Standard/Redirect** method (payType = "0"). The flow is as follows:

1. **Initiation**: The customer selects "ICICI Orange PG" at checkout. The frontend calls `POST /api/payment/icici/initiate`.
2. **Order Preparation**: The backend generates a unique `merchantTxnNo`, creates an order with a `PENDING` status, calculates the HMAC SHA-256 `secureHash`, and submits a server-to-server request to the ICICI `initiateSale` API.
3. **Redirection**: The backend receives a `redirectURI` from ICICI and forwards the customer to the ICICI payment page.
4. **Completion**: After the transaction, ICICI sends a `POST` response to the backend's `returnURL` (`/api/payment/icici/response`).
5. **Verification**: The backend verifies the `secureHash` and updates the order status based on the `responseCode`. It then redirects the user to the frontend's Order Details page.
6. **Double Check**: The frontend (`OrderDetailPage.jsx`) calls the `POST /api/payment/icici/status` API to actively verify the final status if the order is still pending.

## 2. Environment Variables

Add the following to your backend `.env` file:

```env
ICICI_ENV=uat
ICICI_MERCHANT_ID=your_merchant_id
ICICI_HASH_KEY=your_hash_key
ICICI_SALE_URL=https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale
ICICI_COMMAND_URL=https://pgpayuat.icicibank.com/tsp/pg/api/command
ICICI_QR_URL=https://pgpayuat.icicibank.com/tsp/pg/api/generateQR
```

## 3. API Endpoints

### `POST /api/payment/icici/initiate`
Initiates a new ICICI sale and returns the redirect URI.
- **Request**: `{ "orderId": "..." }`
- **Response**: `{ "success": true, "redirectURI": "...", "merchantTxnNo": "..." }`

### `POST /api/payment/icici/response`
The browser redirect callback from ICICI. Verifies hash and updates DB.

### `POST /api/payment/icici/advice`
Server-to-server webhook (idempotent) for background status updates.

### `POST /api/payment/icici/status`
Queries the ICICI Command API to check the real-time status of a transaction.

### `POST /api/payment/icici/qr`
Generates a UPI QR Code using the ICICI QR API.
- **Response**: `{ "success": true, "upiQR": "upi://pay?...", "merchantRefNo": "..." }`

### `POST /api/payment/icici/refund` (Admin)
Initiates a refund for a successful transaction.

## 4. Hash Generation Logic

Located at `backend/utils/iciciHash.js`.
It strictly follows Hash V1:
1. Filters out null, undefined, empty string, and `secureHash` parameters.
2. Sorts parameter keys alphabetically.
3. Concatenates key + value pairs.
4. Generates HMAC-SHA256 using the ICICI Hash Key.
5. Returns a lowercase hex string.

## 5. Security & Idempotency
- **Hash Verification**: All callbacks (response and advice) verify the `secureHash` before changing order status.
- **Idempotency**: The system checks `if (order.isPaid)` to prevent duplicate callbacks from reprocessing.
- **Amount Validation**: The order total is fetched directly from the database; the frontend amount is ignored.
- **Secrets Management**: No merchant keys or hashes are exposed to the frontend.

## 6. UAT Testing Instructions
1. Ensure `.env` is configured with UAT credentials.
2. Run the application and select "ICICI Orange PG" during checkout.
3. Upon redirection to ICICI, use the provided test cards to complete the transaction.
4. Verify the redirect brings you back to the Raj Electronics order success page.
5. Verify MongoDB shows `paymentDetails.paymentStatus = 'PAID'`.

## 7. Production Deployment
1. Replace `ICICI_ENV=uat` with `ICICI_ENV=prod`.
2. Update the `ICICI_MERCHANT_ID` and `ICICI_HASH_KEY` with production credentials.
3. Update the ICICI API URLs to point to production endpoints (e.g., removing `uat` from the domain).
