export {
  loginSchema,
  customerRegisterSchema,
  atlasRegisterFormSchema,
  merchantRegisterSchema,
  completeProfileSchema,
  type LoginInput,
  type CustomerRegisterInput,
  type AtlasRegisterFormInput,
  type MerchantRegisterInput,
  type CompleteProfileInput,
} from "@/modules/auth/validators";

export {
  walletAddressSchema,
  emailSchema,
  passwordSchema,
  uuidSchema,
  paginationSchema,
  idParamSchema,
  type PaginationInput,
} from "./common";

export {
  productSchema,
  type ProductInput,
} from "@/modules/catalog/validators";

export {
  initiatePaymentSchema,
  verifyPaymentSchema,
  cryptoPaymentMethods,
  type InitiatePaymentInput,
  type VerifyPaymentInput,
  type CryptoPaymentMethod,
} from "@/modules/payments/validators";

export {
  platformSettingsSchema,
  feeScheduleSchema,
  exchangeRateSchema,
  type PlatformSettingsInput,
  type FeeScheduleInput,
  type ExchangeRateInput,
} from "@/modules/platform/validators";
