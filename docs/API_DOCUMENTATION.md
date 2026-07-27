# Nexar Network API Documentation

## Overview

The Nexar Network API provides a comprehensive REST API for integrating payment processing into your applications. This documentation covers authentication, invoice management, payment processing, and more.

## Base URL

```
https://www.nexarnetwork.org/api/v1
```

For development:
```
http://localhost:3000/api
```

## Authentication

### API Key Authentication

Most API endpoints require authentication using an API key. Include your API key in the request header:

```http
X-API-Key: your_api_key_here
```

### Session Authentication

For dashboard operations, use session-based authentication:

```http
Authorization: Bearer your_session_token_here
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_verified": false,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "id": "session_id",
    "token": "session_token",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_verified": false,
    "last_login_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "id": "session_id",
    "token": "session_token",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}
```

#### Logout
```http
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer session_token
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Merchants

#### Create Merchant
```http
POST /api/merchants
```

**Headers:**
```
Authorization: Bearer session_token
```

**Request Body:**
```json
{
  "business_name": "My Business",
  "business_type": "retail",
  "tax_id": "123456789",
  "website_url": "https://example.com",
  "description": "A retail business",
  "support_email": "support@example.com",
  "support_phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "merchant": {
    "id": "merchant_id",
    "business_name": "My Business",
    "business_type": "retail",
    "status": "pending",
    "is_verified": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Merchant
```http
GET /api/merchants
```

**Headers:**
```
Authorization: Bearer session_token
```

**Response:**
```json
{
  "success": true,
  "merchant": {
    "id": "merchant_id",
    "business_name": "My Business",
    "business_type": "retail",
    "status": "active",
    "is_verified": true,
    "settlement_currency": "USDT",
    "webhook_url": "https://example.com/webhook",
    "support_email": "support@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Merchant Settings
```http
PUT /api/merchants/settings
```

**Headers:**
```
Authorization: Bearer session_token
```

**Request Body:**
```json
{
  "auto_settlement": true,
  "settlement_frequency": "daily",
  "minimum_settlement_amount": 10,
  "require_email_confirmation": true,
  "payment_timeout_minutes": 30,
  "max_invoice_amount": 100000,
  "notification_enabled": true,
  "notification_methods": ["email", "webhook"]
}
```

#### Create API Key
```http
POST /api/merchants/api-keys
```

**Headers:**
```
Authorization: Bearer session_token
```

**Request Body:**
```json
{
  "key_name": "Production Key",
  "permissions": ["read", "write"],
  "expires_at": "2025-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "api_key": {
    "id": "api_key_id",
    "key_name": "Production Key",
    "key_prefix": "nxr_abc123",
    "key": "nxr_abc123_xyz789...",
    "permissions": ["read", "write"],
    "is_active": true,
    "expires_at": "2025-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Get API Keys
```http
GET /api/merchants/api-keys
```

**Headers:**
```
Authorization: Bearer session_token
```

**Response:**
```json
{
  "success": true,
  "api_keys": [
    {
      "id": "api_key_id",
      "key_name": "Production Key",
      "key_prefix": "nxr_abc123",
      "permissions": ["read", "write"],
      "is_active": true,
      "last_used_at": "2024-01-01T12:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Wallet
```http
POST /api/merchants/wallets
```

**Headers:**
```
Authorization: Bearer session_token
```

**Request Body:**
```json
{
  "currency": "USDT",
  "address": "0x1234567890123456789012345678901234567890",
  "is_default": true
}
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "id": "wallet_id",
    "currency": "USDT",
    "address": "0x1234567890123456789012345678901234567890",
    "is_default": true,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Wallets
```http
GET /api/merchants/wallets
```

**Headers:**
```
Authorization: Bearer session_token
```

#### Get Dashboard Stats
```http
GET /api/merchants/dashboard
```

**Headers:**
```
Authorization: Bearer session_token
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_revenue": 10000.50,
    "total_payments": 150,
    "total_customers": 75,
    "total_invoices": 200,
    "pending_invoices": 10,
    "paid_invoices": 180,
    "average_order_value": 50.00,
    "revenue_this_month": 2500.00,
    "payments_this_month": 35
  }
}
```

### Invoices

#### Create Invoice
```http
POST /api/invoices
```

**Headers:**
```
X-API-Key: your_api_key
```

**Request Body:**
```json
{
  "customer_email": "customer@example.com",
  "description": "Product purchase",
  "amount": 100.00,
  "currency": "USD",
  "items": [
    {
      "description": "Product A",
      "quantity": 2,
      "unit_price": 50.00
    }
  ],
  "expires_in": 30,
  "metadata": {
    "order_id": "ORDER-123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": "invoice_id",
    "invoice_number": "INV-20240101-1234",
    "description": "Product purchase",
    "amount": 100.00,
    "currency": "USD",
    "status": "pending",
    "payment_url": "https://www.nexarnetwork.org/checkout/i/invoice_id",
    "qr_code_url": "data:image/png;base64,...",
    "expires_at": "2024-01-01T00:30:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Invoices
```http
GET /api/invoices?status=pending&limit=50&offset=0
```

**Headers:**
```
X-API-Key: your_api_key
```

**Response:**
```json
{
  "success": true,
  "invoices": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100
  }
}
```

#### Get Invoice
```http
GET /api/invoices/{id}
```

**Headers:**
```
X-API-Key: your_api_key
```

#### Update Invoice Status
```http
PATCH /api/invoices/{id}
```

**Headers:**
```
Authorization: Bearer session_token
```

**Request Body:**
```json
{
  "status": "cancelled",
  "reason": "Customer request"
}
```

### Payment Sessions

#### Create Payment Session
```http
POST /api/checkout/sessions
```

**Request Body:**
```json
{
  "invoice_id": "invoice_id",
  "customer_email": "customer@example.com",
  "supported_currencies": ["NXR", "USDT", "BTC"]
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session_id",
    "session_id": "ses_1234567890_abc",
    "status": "pending",
    "checkout_url": "https://www.nexarnetwork.org/checkout/ses_1234567890_abc",
    "expires_at": "2024-01-01T00:30:00Z",
    "supported_currencies": ["NXR", "USDT", "BTC"]
  }
}
```

#### Get Payment Session
```http
GET /api/checkout/sessions/{sessionId}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session_id",
    "session_id": "ses_1234567890_abc",
    "status": "pending",
    "selected_currency": "USDT",
    "crypto_amount": 100.00,
    "exchange_rate": 1.0,
    "supported_currencies": ["NXR", "USDT", "BTC"],
    "expires_at": "2024-01-01T00:30:00Z"
  },
  "invoice": {
    "id": "invoice_id",
    "invoice_number": "INV-20240101-1234",
    "description": "Product purchase",
    "amount": 100.00,
    "currency": "USD",
    "status": "pending"
  },
  "payment_details": {
    "wallet_address": "0x1234567890123456789012345678901234567890",
    "crypto_amount": 100.00,
    "currency": "USDT",
    "exchange_rate": 1.0
  },
  "time_remaining": 1800
}
```

#### Select Currency
```http
PATCH /api/checkout/sessions/{sessionId}
```

**Request Body:**
```json
{
  "currency": "USDT"
}
```

### Payments

#### Create Payment
```http
POST /api/payments
```

**Headers:**
```
X-API-Key: your_api_key
```

**Request Body:**
```json
{
  "invoice_id": "invoice_id",
  "payment_session_id": "session_id",
  "customer_id": "customer_id",
  "to_address": "0x1234567890123456789012345678901234567890",
  "amount": 100.00,
  "currency": "USDT",
  "from_address": "0x0987654321098765432109876543210987654321"
}
```

#### Get Payments
```http
GET /api/payments?status=confirmed&limit=50&offset=0
```

**Headers:**
```
X-API-Key: your_api_key
```

#### Get Payment
```http
GET /api/payments/{id}
```

**Headers:**
```
X-API-Key: your_api_key
```

#### Update Payment
```http
PATCH /api/payments/{id}
```

**Headers:**
```
Authorization: Bearer session_token
```

**Request Body:**
```json
{
  "action": "confirm",
  "transaction_hash": "0xabcdef...",
  "block_number": 12345678
}
```

### Customers

#### Create Customer
```http
POST /api/customers
```

**Headers:**
```
X-API-Key: your_api_key
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "phone": "+1234567890",
  "full_name": "John Doe",
  "metadata": {
    "custom_field": "value"
  }
}
```

#### Get Customers
```http
GET /api/customers?limit=50&offset=0
```

**Headers:**
```
X-API-Key: your_api_key
```

### Prices

#### Get Exchange Rate
```http
GET /api/prices?from=USD&to=USDT
```

**Response:**
```json
{
  "success": true,
  "from": "USD",
  "to": "USDT",
  "rate": 1.0,
  "timestamp": 1704067200000
}
```

#### Convert Amount
```http
GET /api/prices?from=USD&to=USDT&amount=100
```

**Response:**
```json
{
  "success": true,
  "from": "USD",
  "to": "USDT",
  "amount": 100,
  "converted_amount": 100,
  "rate": 1.0,
  "timestamp": 1704067200000
}
```

#### Get All Rates
```http
GET /api/prices
```

**Response:**
```json
{
  "success": true,
  "rates": [
    {
      "from_currency": "USD",
      "to_currency": "USDT",
      "rate": 1.0,
      "timestamp": 1704067200000
    }
  ],
  "supported_currencies": ["NXR", "BNB", "USDT", "USDC", "BTC", "ETH", "USD"],
  "cache_size": 10
}
```

## Webhooks

### Webhook Events

Nexar Network sends webhook notifications for the following events:

- `invoice.created` - When an invoice is created
- `invoice.paid` - When an invoice is paid
- `invoice.expired` - When an invoice expires
- `payment.confirmed` - When a payment is confirmed
- `payment.failed` - When a payment fails

### Webhook Format

```json
{
  "event": "invoice.paid",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "invoice_id": "invoice_id",
    "invoice_number": "INV-20240101-1234",
    "amount": 100.00,
    "currency": "USD",
    "payment_id": "payment_id"
  }
}
```

### Webhook Security

Webhooks are signed using your webhook secret. Verify the signature by comparing the HMAC-SHA256 hash of the request body with the `X-Webhook-Signature` header.

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

## Rate Limiting

API requests are rate limited to prevent abuse:

- Standard endpoints: 100 requests per minute
- Payment endpoints: 30 requests per minute
- Admin endpoints: 10 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200000
```

## Supported Currencies

- **NXR** - Nexar Network Token
- **BNB** - Binance Coin
- **USDT** - Tether USD
- **USDC** - USD Coin
- **BTC** - Bitcoin
- **ETH** - Ethereum
- **USD** - US Dollar

## SDK & Libraries

Official SDKs are available for:

- JavaScript/TypeScript
- Python
- Go
- Rust

See the [Developer Documentation](/developer/docs) for more details.
