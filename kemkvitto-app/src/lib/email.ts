interface Receipt {
  id: string;
  receipt_number: number;
  garments: Record<string, number>;
  delivery_date: string;
  customer_email: string;
  comment: string | null;
}

export async function sendReceiptEmail(receipt: Receipt): Promise<void> {
  console.log("=== EMAIL SENT ===");
  console.log(`To: ${receipt.customer_email}`);
  console.log(`Receipt #${receipt.receipt_number}`);
  console.log(`Garments:`, receipt.garments);
  console.log(`Delivery date: ${receipt.delivery_date}`);
  if (receipt.comment) console.log(`Comment: ${receipt.comment}`);
  console.log("==================");
}

export async function sendReminderEmail(receipt: Receipt): Promise<void> {
  console.log("=== REMINDER EMAIL ===");
  console.log(`To: ${receipt.customer_email}`);
  console.log(`Receipt #${receipt.receipt_number} is ready for pickup!`);
  console.log(`Garments:`, receipt.garments);
  console.log("======================");
}
