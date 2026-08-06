/**
 * ATLAS Mobile — camera / scanner contracts (OCR-ready stubs).
 */

import type { MobileCameraJobType } from "./types";

export type CameraJobRequest = {
  jobType: MobileCameraJobType;
  mediaPath?: string;
  hints?: Record<string, unknown>;
};

export type CameraJobResult = {
  status: "stub" | "queued" | "completed" | "failed";
  jobType: MobileCameraJobType;
  extracted?: Record<string, unknown>;
  message?: string;
};

export const CAMERA_JOB_TYPES: MobileCameraJobType[] = [
  "document",
  "invoice",
  "receipt",
  "qr",
  "barcode",
  "business_card",
  "ocr",
  "product",
];

export function createCameraJobStub(
  input: CameraJobRequest,
): CameraJobResult {
  return {
    status: "stub",
    jobType: input.jobType,
    extracted: {
      message: `Camera/OCR stub for ${input.jobType}`,
      ...(input.hints ?? {}),
    },
    message: "OCR pipeline not wired — foundation contract only",
  };
}
