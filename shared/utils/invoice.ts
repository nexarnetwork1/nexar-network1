// Invoice system utilities
// This file provides invoice number generation and validation

/**
 * Generate invoice number in format INV-YYYY-NNNNNN
 * Format: INV-2026-000001
 */
export function generateInvoiceNumber(year?: number, sequence?: number): string {
  const currentYear = year || new Date().getFullYear();
  const sequenceNumber = sequence || 1;
  const paddedSequence = sequenceNumber.toString().padStart(6, '0');
  return `INV-${currentYear}-${paddedSequence}`;
}

/**
 * Parse invoice number
 */
export function parseInvoiceNumber(invoiceNumber: string): {
  prefix: string;
  year: number;
  sequence: number;
} | null {
  const match = invoiceNumber.match(/^INV-(\d{4})-(\d{6})$/);
  if (!match) return null;
  
  return {
    prefix: 'INV',
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}

/**
 * Validate invoice number format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  return parseInvoiceNumber(invoiceNumber) !== null;
}

/**
 * Generate invoice number from timestamp
 */
export function generateInvoiceNumberFromTimestamp(timestamp?: Date): string {
  const date = timestamp || new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const timeBasedSequence = parseInt(
    `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`,
    10
  );
  return generateInvoiceNumber(year, timeBasedSequence % 1000000);
}

/**
 * Get next invoice number based on last invoice
 */
export function getNextInvoiceNumber(lastInvoiceNumber: string): string {
  const parsed = parseInvoiceNumber(lastInvoiceNumber);
  if (!parsed) {
    return generateInvoiceNumber();
  }
  
  const currentYear = new Date().getFullYear();
  const year = parsed.year === currentYear ? parsed.year : currentYear;
  const sequence = parsed.year === currentYear ? parsed.sequence + 1 : 1;
  
  return generateInvoiceNumber(year, sequence);
}

/**
 * Invoice metadata interface
 */
export interface InvoiceMetadata {
  invoiceNumber: string;
  generatedAt: Date;
  generatedBy: string; // system or user ID
  revision: number;
  previousInvoiceNumber?: string;
}

/**
 * Generate invoice metadata
 */
export function generateInvoiceMetadata(generatedBy: string, previousInvoiceNumber?: string): InvoiceMetadata {
  return {
    invoiceNumber: previousInvoiceNumber ? getNextInvoiceNumber(previousInvoiceNumber) : generateInvoiceNumber(),
    generatedAt: new Date(),
    generatedBy,
    revision: previousInvoiceNumber ? (parseInvoiceNumber(previousInvoiceNumber)?.sequence || 0) + 1 : 1,
    previousInvoiceNumber,
  };
}

/**
 * Format invoice number for display
 */
export function formatInvoiceNumber(invoiceNumber: string): string {
  return invoiceNumber; // Already formatted
}

/**
 * Short invoice number for display (INV-26-000001)
 */
export function formatShortInvoiceNumber(invoiceNumber: string): string {
  const parsed = parseInvoiceNumber(invoiceNumber);
  if (!parsed) return invoiceNumber;
  
  const shortYear = parsed.year.toString().substring(2);
  return `INV-${shortYear}-${parsed.sequence.toString().padStart(6, '0')}`;
}

/**
 * Check if invoice is from current year
 */
export function isCurrentYearInvoice(invoiceNumber: string): boolean {
  const parsed = parseInvoiceNumber(invoiceNumber);
  if (!parsed) return false;
  
  return parsed.year === new Date().getFullYear();
}

/**
 * Get invoice year
 */
export function getInvoiceYear(invoiceNumber: string): number | null {
  const parsed = parseInvoiceNumber(invoiceNumber);
  return parsed ? parsed.year : null;
}

/**
 * Get invoice sequence
 */
export function getInvoiceSequence(invoiceNumber: string): number | null {
  const parsed = parseInvoiceNumber(invoiceNumber);
  return parsed ? parsed.sequence : null;
}
