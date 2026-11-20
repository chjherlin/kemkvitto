"use client";

import { useParams, useSearchParams } from "next/navigation";
import CustomerEmailForm from "@/components/CustomerEmailForm";
import { DEFAULT_BRAND } from "@/lib/brand";

export default function CustomerEmailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const brandColor = searchParams.get("brand") || DEFAULT_BRAND;
  const businessName = searchParams.get("name") || undefined;

  return (
    <CustomerEmailForm
      receiptId={id}
      brandColor={brandColor}
      businessName={businessName}
    />
  );
}
