/**
 * Blockchain I/O layer — chain reads, deposit addresses, payment verification.
 * Business rules live in modules/ and lib/payments/; on-chain writes in modules/settlement/.
 */
export { getTokenAddress, type CryptoAsset } from "./bsc-client";
export { deriveSessionDepositAddress, buildQrPayload } from "./deposit";
export { verifyCryptoPayment, findIncomingTxHash } from "./verify-payment";
