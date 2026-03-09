"use client";

import { useParams, useSearchParams } from "next/navigation";
import CustomerEmailForm from "@/components/CustomerEmailForm";

export default function CustomerEmailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const brandColor = searchParams.get("brand") || "#0891b2";
  const businessName = searchParams.get("name") || undefined;

  return (
    <CustomerEmailForm
      receiptId={id}
      brandColor={brandColor}
      businessName={businessName}
    />
  );
}
