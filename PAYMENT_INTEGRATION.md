# Raj Electronics — Payment Integration

## Architecture

```
RAJ ELECTRONICS WEBSITE
        │
        ▼
PRODUCT / CART
        │
        ▼
CHECKOUT
        │
        ├──────────────────────┐
        ▼                      ▼
COUPON ENGINE          BANK OFFER ENGINE
                               │
                     ┌─────────┼─────────┐
                     ▼         ▼         ▼
                   HDFC       SBI       ICICI
                     │         │         │
                     └─────────┼─────────┘
                               ▼
                       ELIGIBILITY CHECK
                               │
                               ▼
                       DISCOUNT CALCULATION
                               │
                               ▼
                     FINAL PAYABLE AMOUNT
                               │
                               ▼
                     PINE LABS PAYMENT
                               │
                               ▼
                     PAYMENT VERIFICATION
                               │
                               ▼
                        ORDER CONFIRMED
```

**Active payment gateway:** Pine Labs Online (Hosted Checkout)  
**Bank offers:** Independent from Pine Labs — HDFC, SBI, ICICI  
**ICICI Orange PG:** Legacy/secondary — not mixed into Pine Labs flow

---

## Checkout Flow

1. Customer adds products to cart (optionally applies bank offer on PDP)
2. Customer proceeds to checkout
3. **Server-side** calculation: subtotal → coupon discount → bank discount → shipping → final amount
4. Pending order created (`status: Pending`, `isPaid: false`)
5. Pine Labs hosted checkout initiated via `POST /api/payment/pinelabs/initiate`
6. Customer redirected to Pine Labs secure payment page
7. Customer completes payment (Card / UPI / Net Banking)
8. Pine Labs calls **Return URL** and **Webhook URL**
9. Backend verifies signature + fetches order status from Pine Labs API
10. Order confirmed **only after server-side verification**

---

## Coupon Engine

- Hardcoded legacy coupon: `DISCOUNT10` (10% off)
- Full `Coupon` model with admin CRUD at `/api/coupons`
- Server-side validation via `checkoutCalculationService.validateCoupon()`
- Never trust frontend discount amounts

---

## Bank Offer Engine

**Files:** `backend/services/bankOfferEngine.js`

| Function | Purpose |
|----------|---------|
| `getEligibleBankOffers()` | Returns eligible HDFC/SBI/ICICI offers for cart |
| `calculateBankDiscount()` | Calculates total bank discount from cart items |

**Eligibility checks:**
- Product eligibility (applied offer on cart item)
- Minimum / maximum transaction amount
- Offer validity dates
- Active status
- Bank name (HDFC, SBI, ICICI)

Bank offers are **independent** from Pine Labs. Discount is applied before Pine Labs receives the final payable amount.

---

## Pine Labs Integration

### Authentication
- OAuth 2.0 Client Credentials
- `POST /api/auth/v1/token`
- UAT: `https://pluraluat.v2.pinepg.in`
- Production: `https://api.pluralonline.com`

### Payment Initiation
- Hosted Checkout: `POST /api/checkout/v1/orders`
- Returns `redirect_url` for customer redirect

### Payment Verification
- Return URL callback with `order_id`, `status`, `signature`
- Webhook: `POST /api/payment/pinelabs/webhook`
- Status API: `GET /api/pay/v1/orders/{order_id}`
- HMAC-SHA256 signature verification using `PINE_LABS_SIGNATURE_KEY`

### Refund
- `POST /api/pay/v1/refunds/{order_id}` via `POST /api/payment/pinelabs/refund` (admin)

---

## Environment Variables

```env
PINE_LABS_ENV=uat
PINE_LABS_MID=111077
PINE_LABS_CLIENT_ID=59194fe5-4c27-4e6e-8deb-4e59f8f4fd7b
PINE_LABS_CLIENT_SECRET=<secret>
PINE_LABS_SIGNATURE_KEY=<onboarding_key>
PINE_LABS_RETURN_URL=http://localhost:5001/api/payment/pinelabs/return
PINE_LABS_WEBHOOK_URL=http://localhost:5001/api/payment/pinelabs/webhook
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:5173
```

**Security:** Client Secret must never appear in frontend, logs, Git, or API responses.

---

## UAT Configuration

| Variable | Value |
|----------|-------|
| MID | `111077` |
| Client ID | `59194fe5-4c27-4e6e-8deb-4e59f8f4fd7b` |
| Environment | `uat` |
| Base URL | `https://pluraluat.v2.pinepg.in` |

Share **Return URL** and **Webhook URL** with Pine Labs for whitelisting before Go-Live.

### Local Development (Important — 403 Fix)

Pine Labs **blocks `localhost` callback URLs** (CloudFront 403). For local UAT:

1. Payment initiation works **without** localhost callback (already handled in code).
2. After paying on Pine Labs page, go to **My Orders → open order → Verify Payment Status**.
3. For automatic return redirect, use **ngrok**:

```bash
ngrok http 5001
```

Then in `backend/.env`:
```env
PINE_LABS_PUBLIC_URL=https://your-id.ngrok-free.app
```

Share with Pine Labs for whitelisting:
```
https://your-id.ngrok-free.app/api/payment/pinelabs/return
https://your-id.ngrok-free.app/api/payment/pinelabs/webhook
```

---

## UPI Testing (UAT Simulator)

Amounts are in **paisa** (paise):

| Amount Range (paisa) | HTTP Status | Expected Result |
|---------------------|-------------|-----------------|
| 100 – 50,000 | 200 | Success |
| 50,100 – 60,000 | 200 | Pending |
| 60,100 – 70,000 | 200 | Final Failed |
| 70,100 – 80,000 | 404 | Error |
| 80,000+ | 504 | Timeout |

---

## Net Banking Testing (UAT)

Use **State Bank of India (SBI)** for Net Banking UAT testing per Pine Labs email.

---

## Test Card (UAT Only)

| Field | Value |
|-------|-------|
| Card Number | `4012 0010 3714 1112` |
| CVV | `123` |
| Expiry | Any future date |

---

## Go-Live Checklist

- [ ] Production Pine Labs credentials obtained
- [ ] Production Return URL configured and whitelisted
- [ ] Production Webhook URL configured and whitelisted
- [ ] `PINE_LABS_SIGNATURE_KEY` configured
- [ ] HTTPS enabled
- [ ] All payment scenarios tested
- [ ] No secrets in source code or frontend

---

## Remaining Information Required from Pine Labs

1. `PINE_LABS_SIGNATURE_KEY` — webhook/callback HMAC secret from onboarding team
2. Production credentials — MID, Client ID, Client Secret
3. Webhook event payload format confirmation
4. URL whitelisting confirmation after sharing Return/Webhook URLs
