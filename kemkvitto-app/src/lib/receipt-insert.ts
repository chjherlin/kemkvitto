export interface ReceiptSaveInput {
  washerId: string;
  /** Already formatted. The route decides padding before calling this. */
  receiptNumber: string;
  tagNumber?: string | null;
  garments: unknown;
  deliveryDate: string;
  dropOffDate?: string | null;
  comment?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  amountTotal?: number | null;
  services?: string[] | null;
}

/** Every field the receipt form collects. Nothing here is optional at insert time. */
export function buildReceiptInsert(input: ReceiptSaveInput): Record<string, unknown> {
  return {
    washer_id: input.washerId,
    receipt_number: String(input.receiptNumber),
    tag_number: input.tagNumber || null,
    garments: input.garments,
    delivery_date: input.deliveryDate,
    customer_email: input.customerEmail || "",
    comment: input.comment || null,
    customer_name: input.customerName || null,
    customer_phone: input.customerPhone || null,
    drop_off_date: input.dropOffDate || null,
    amount_total: input.amountTotal ?? 0,
    services: input.services ?? [],
  };
}
