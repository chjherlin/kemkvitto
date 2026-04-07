export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12" style={{ color: "var(--text)" }}>
      <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Terms of Service</h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>AP&amp;E Ltd · Last updated: April 2026</p>

      <h2 className="mb-3 text-xl font-bold">1. Agreement</h2>
      <p className="mb-4">By registering for or using Kemkvitto ("the Service"), you ("the Customer") agree to these Terms of Service. If you do not agree, do not use the Service.</p>
      <p className="mb-4">The Service is intended for business use only. By registering, you confirm that you are acting in a professional or commercial capacity.</p>
      <p className="mb-8">The Service may be offered under different names in different languages or markets. All such versions are operated by AP&amp;E Ltd and these Terms apply equally regardless of the name under which the Service is accessed.</p>

      <h2 className="mb-3 text-xl font-bold">2. The Service</h2>
      <p className="mb-4">Kemkvitto provides a digital receipt and customer notification tool for retail businesses that traditionally issue physical paper slips or receipts to customers when receiving items for cleaning, repair, alteration, or similar services. This includes, but is not limited to, dry cleaners, shoe repairers, tailors, and laundries.</p>
      <p className="mb-8">The Service allows you to issue digital receipts to your customers via email and send automated pickup reminders.</p>

      <h2 className="mb-3 text-xl font-bold">3. Account Registration</h2>
      <p className="mb-8">You must provide accurate and complete information when registering. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.</p>

      <h2 className="mb-3 text-xl font-bold">4. Subscription and Payment</h2>
      <p className="mb-4">Access to the Service requires payment of the monthly fee as stated at the time of registration. Fees are charged in advance on a monthly basis via the payment method you provide.</p>
      <p className="mb-4">We offer a free trial period of 30 days. No payment is required during the trial. After the trial period ends, the monthly fee applies automatically unless you cancel before the trial expires.</p>
      <p className="mb-8">All fees are exclusive of applicable taxes.</p>

      <h2 className="mb-3 text-xl font-bold">5. Cancellation and Termination</h2>
      <p className="mb-4">You may cancel your subscription at any time by contacting us at <a href="mailto:legal@kemkvitto.se" className="underline">legal@kemkvitto.se</a>. Cancellation takes effect at the end of the current billing period.</p>
      <p className="mb-8">We reserve the right to suspend or terminate your account with at least 7 days' written notice, or immediately in cases of breach of these Terms, non-payment, or misuse of the Service.</p>

      <h2 className="mb-3 text-xl font-bold">6. Data and Privacy</h2>
      <p className="mb-4">When you use the Service to send receipts, your customers' email addresses are processed by Kemkvitto on your behalf. You, as the business, are the data controller. AP&amp;E Ltd acts as a data processor.</p>
      <p className="mb-4">Email addresses are stored for 90 days following the most recent receipt or visit. Upon a new visit, the retention period renews automatically.</p>
      <p className="mb-8">For full details on data processing, please see our <a href="/privacy" className="underline">Privacy Policy</a>.</p>

      <h2 className="mb-3 text-xl font-bold">7. Acceptable Use</h2>
      <p className="mb-2">You agree not to use the Service to:</p>
      <ul className="mb-8 list-disc pl-6 space-y-1">
        <li>Send unsolicited commercial communications beyond the receipt and pickup reminder purpose</li>
        <li>Process or store sensitive personal data beyond what is necessary for the receipt function</li>
        <li>Violate any applicable laws or regulations</li>
      </ul>

      <h2 className="mb-3 text-xl font-bold">8. Intellectual Property</h2>
      <p className="mb-8">All intellectual property rights in the Service belong to AP&amp;E Ltd. You are granted a limited, non-exclusive, non-transferable licence to use the Service for its intended purpose during your subscription.</p>

      <h2 className="mb-3 text-xl font-bold">9. Availability and Changes</h2>
      <p className="mb-4">We aim to provide a reliable service but do not guarantee uninterrupted availability. We reserve the right to modify, update, or discontinue features of the Service with reasonable notice.</p>
      <p className="mb-8">We may update these Terms from time to time. We will notify you of material changes by email. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>

      <h2 className="mb-3 text-xl font-bold">10. Limitation of Liability</h2>
      <p className="mb-8">To the fullest extent permitted by law, AP&amp;E Ltd is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability to you shall not exceed the fees paid by you in the three months preceding the claim.</p>

      <h2 className="mb-3 text-xl font-bold">11. Governing Law</h2>
      <p className="mb-8">These Terms are governed by the laws of Gibraltar. Any disputes shall be subject to the exclusive jurisdiction of the courts of Gibraltar.</p>

      <h2 className="mb-3 text-xl font-bold">12. Contact</h2>
      <p>legal@kemkvitto.se<br />AP&amp;E Ltd, 5-9 Main Street, Gibraltar GX11 1AA</p>
    </div>
  );
}
