// Shared route constants for payment platform

export const MERCHANT_ROUTES = {
  overview: '/merchant/overview',
  integration: '/merchant/integration',
  pricing: '/merchant/pricing',
} as const;

export const DEVELOPER_ROUTES = {
  docs: '/developer/docs',
  apiReference: '/developer/api-reference',
  sdk: '/developer/sdk',
} as const;

export const DASHBOARD_ROUTES = {
  overview: '/dashboard/overview',
  payments: '/dashboard/payments',
  customers: '/dashboard/customers',
  settings: '/dashboard/settings',
} as const;

export const PAYMENTS_ROUTES = {
  overview: '/payments/overview',
  methods: '/payments/methods',
  history: '/payments/history',
} as const;

export const DOCS_ROUTES = {
  home: '/docs',
} as const;

export const API_ROUTES = {
  base: '/api/v1',
  payments: '/api/v1/payments',
  customers: '/api/v1/customers',
  subscriptions: '/api/v1/subscriptions',
  webhooks: '/api/v1/webhooks',
} as const;
