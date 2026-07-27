# Nexar Network Developer Guide

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Nexar Network merchant account
- API key from the merchant dashboard

### Installation

```bash
npm install @nexar-network/sdk
```

### Quick Start

```javascript
import { NexarClient } from '@nexar-network/sdk';

const client = new NexarClient({
  apiKey: 'your_api_key_here',
  environment: 'production' // or 'development'
});

// Create an invoice
const invoice = await client.invoices.create({
  amount: 100.00,
  currency: 'USD',
  description: 'Product purchase',
  customerEmail: 'customer@example.com',
});

console.log(invoice.paymentUrl);
```

## Authentication

### API Key Authentication

```javascript
const client = new NexarClient({
  apiKey: 'your_api_key_here',
});
```

### Session Authentication

```javascript
const client = new NexarClient({
  apiKey: 'your_api_key_here',
  sessionToken: 'your_session_token_here',
});
```

## Invoice Management

### Creating an Invoice

```javascript
const invoice = await client.invoices.create({
  amount: 100.00,
  currency: 'USD',
  description: 'Product purchase',
  customerEmail: 'customer@example.com',
  items: [
    {
      description: 'Product A',
      quantity: 2,
      unitPrice: 50.00,
    }
  ],
  expiresIn: 30, // minutes
  metadata: {
    orderId: 'ORDER-123',
  },
});
```

### Retrieving an Invoice

```javascript
const invoice = await client.invoices.get('invoice_id');
```

### Listing Invoices

```javascript
const invoices = await client.invoices.list({
  status: 'pending',
  limit: 50,
  offset: 0,
});
```

### Updating Invoice Status

```javascript
const updated = await client.invoices.updateStatus('invoice_id', 'cancelled', {
  reason: 'Customer request',
});
```

## Payment Processing

### Creating a Payment Session

```javascript
const session = await client.checkout.createSession({
  invoiceId: 'invoice_id',
  customerEmail: 'customer@example.com',
  supportedCurrencies: ['NXR', 'USDT', 'BTC'],
});

console.log(session.checkoutUrl);
```

### Getting Payment Session Details

```javascript
const details = await client.checkout.getSession('session_id');

console.log(details.walletAddress);
console.log(details.cryptoAmount);
console.log(details.timeRemaining);
```

### Selecting Payment Currency

```javascript
const result = await client.checkout.selectCurrency('session_id', 'USDT');

console.log(result.cryptoAmount);
console.log(result.exchangeRate);
```

## Payment Monitoring

### Getting Payment Status

```javascript
const status = await client.payments.getStatus('payment_id');

console.log(status.payment.status);
console.log(status.confirmations_remaining);
```

### Listing Payments

```javascript
const payments = await client.payments.list({
  status: 'confirmed',
  limit: 50,
  offset: 0,
});
```

### Confirming a Payment

```javascript
const result = await client.payments.confirm('payment_id', {
  transactionHash: '0xabcdef...',
  blockNumber: 12345678,
});
```

## Currency Conversion

### Getting Exchange Rates

```javascript
const rate = await client.prices.getRate('USD', 'USDT');

console.log(rate.rate); // 1.0
console.log(rate.timestamp);
```

### Converting Amounts

```javascript
const result = await client.prices.convert(100, 'USD', 'USDT');

console.log(result.amount); // 100.0
console.log(result.rate); // 1.0
```

### Getting All Rates

```javascript
const rates = await client.prices.getAllRates();

rates.forEach(rate => {
  console.log(`${rate.from_currency} -> ${rate.to_currency}: ${rate.rate}`);
});
```

## Customer Management

### Creating a Customer

```javascript
const customer = await client.customers.create({
  email: 'customer@example.com',
  fullName: 'John Doe',
  phone: '+1234567890',
  metadata: {
    loyaltyTier: 'gold',
  },
});
```

### Listing Customers

```javascript
const customers = await client.customers.list({
  limit: 50,
  offset: 0,
});
```

## Webhooks

### Setting Up Webhooks

Configure your webhook URL in the merchant dashboard or via API:

```javascript
await client.merchants.updateSettings({
  webhookUrl: 'https://your-domain.com/webhook',
  webhookSecret: 'your_webhook_secret',
});
```

### Handling Webhook Events

```javascript
import express from 'express';
import crypto from 'crypto';

const app = express();

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);

  switch (event.event) {
    case 'invoice.paid':
      handleInvoicePaid(event.data);
      break;
    case 'payment.confirmed':
      handlePaymentConfirmed(event.data);
      break;
    default:
      console.log('Unhandled event:', event.event);
  }

  res.status(200).send('OK');
});

function handleInvoicePaid(data) {
  console.log('Invoice paid:', data.invoice_id);
  // Update your database, send confirmation email, etc.
}

function handlePaymentConfirmed(data) {
  console.log('Payment confirmed:', data.payment_id);
  // Process the confirmed payment
}
```

## Error Handling

### Error Types

```javascript
try {
  const invoice = await client.invoices.create({
    amount: 100.00,
    currency: 'USD',
  });
} catch (error) {
  if (error instanceof NexarError) {
    switch (error.code) {
      case 'AUTHENTICATION_ERROR':
        console.error('Invalid API key');
        break;
      case 'RATE_LIMIT_ERROR':
        console.error('Rate limit exceeded');
        break;
      case 'VALIDATION_ERROR':
        console.error('Invalid request:', error.message);
        break;
      default:
        console.error('API error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

### Security

1. **Never expose API keys** in client-side code
2. **Use environment variables** for sensitive data
3. **Verify webhook signatures** to prevent fraud
4. **Implement rate limiting** on your webhook endpoints
5. **Use HTTPS** for all API communications

### Performance

1. **Cache exchange rates** to reduce API calls
2. **Use pagination** for large result sets
3. **Implement retry logic** for failed requests
4. **Monitor rate limits** to avoid throttling

### Reliability

1. **Handle webhook retries** (we retry failed webhooks)
2. **Implement idempotency** for critical operations
3. **Log all API interactions** for debugging
4. **Set up monitoring** for API health

## Testing

### Test Mode

Use the development environment for testing:

```javascript
const client = new NexarClient({
  apiKey: 'test_api_key',
  environment: 'development',
});
```

### Mocking Responses

```javascript
import { NexarClient } from '@nexar-network/sdk';
import { MockAdapter } from '@nexar-network/sdk/testing';

const mockAdapter = new MockAdapter();
const client = new NexarClient({
  apiKey: 'test_key',
  adapter: mockAdapter,
});

// Mock invoice creation
mockAdapter.onPost('/invoices').reply(200, {
  success: true,
  invoice: {
    id: 'test_invoice_id',
    // ... other fields
  },
});
```

## Troubleshooting

### Common Issues

**"Invalid API Key"**
- Verify your API key is correct
- Check if the key is active
- Ensure you're using the correct environment

**"Rate Limit Exceeded"**
- Implement exponential backoff
- Cache responses when possible
- Contact support for higher limits

**"Webhook Not Delivered"**
- Verify your webhook URL is accessible
- Check webhook signature verification
- Review webhook retry logs

### Debug Mode

Enable debug logging:

```javascript
const client = new NexarClient({
  apiKey: 'your_api_key',
  debug: true,
});
```

## Support

- Documentation: https://www.nexarnetwork.org/docs
- API Status: https://www.nexarnetwork.org/business/status
- Support Email: admin@nexarnetwork.org
- GitHub Issues: https://github.com/nexar-network/sdk/issues
