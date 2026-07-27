export type EmailTemplateData = Record<string, string | number | boolean>;

export type EmailPayload = {
  to: string;
  subject: string;
  template: string;
  data: EmailTemplateData;
};

export const emailTemplates = {
  welcome: {
    subject: "Welcome to Nexar Network",
    templateId: "welcome",
  },
  orderConfirmation: {
    subject: "Order Confirmation",
    templateId: "order-confirmation",
  },
  paymentReceived: {
    subject: "Payment Received",
    templateId: "payment-received",
  },
  invoiceReady: {
    subject: "Your Invoice is Ready",
    templateId: "invoice-ready",
  },
  passwordReset: {
    subject: "Reset Your Password",
    templateId: "password-reset",
  },
} as const;
