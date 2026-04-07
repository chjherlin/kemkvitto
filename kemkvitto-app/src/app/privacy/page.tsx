export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12" style={{ color: "var(--text)" }}>
      <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Privacy Policy</h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>AP&amp;E Ltd · Last updated: April 2026</p>

      <p className="mb-6">This Privacy Policy explains how AP&amp;E Ltd ("we", "us") collects, uses, and protects personal data in connection with the Kemkvitto service. The Service may be offered under different names in different languages or markets — all such versions are operated by AP&amp;E Ltd and this Policy applies equally.</p>

      <p className="mb-8">This Policy covers two groups: <strong>Section A</strong> — business customers (dry cleaners, shoe repairers, tailors, laundries and similar businesses that subscribe to Kemkvitto) and <strong>Section B</strong> — end customers (individuals whose email addresses are collected through the receipt service).</p>

      <h2 className="mb-4 text-xl font-bold">Section A — Business Customers</h2>

      <h3 className="mb-2 font-semibold">What data we collect</h3>
      <p className="mb-4">When you register we collect your business name, email address, payment information (processed securely by Stripe — we do not store card details), and usage data related to your account.</p>

      <h3 className="mb-2 font-semibold">Why we collect it</h3>
      <p className="mb-4">We use your data to provide and operate your account (Article 6.1(b) GDPR), process payments (Article 6.1(b) GDPR), send service-related communications (Article 6.1(b) GDPR), and to improve the Service (Article 6.1(f) GDPR).</p>

      <h3 className="mb-2 font-semibold">How long we keep it</h3>
      <p className="mb-4">We retain your account data for the duration of your subscription and for up to 12 months after account closure, after which it is deleted or anonymised.</p>

      <h3 className="mb-2 font-semibold">Third-party processors</h3>
      <p className="mb-2">We use the following services to operate Kemkvitto:</p>
      <ul className="mb-8 list-disc pl-6 space-y-1">
        <li><strong>Supabase</strong> — database and data storage (EU)</li>
        <li><strong>Resend</strong> — email delivery (EU)</li>
        <li><strong>Stripe</strong> — payment processing (US/EU)</li>
        <li><strong>Vercel</strong> — hosting and infrastructure (US/EU)</li>
      </ul>

      <h2 className="mb-4 text-xl font-bold">Section B — End Customers</h2>

      <h3 className="mb-2 font-semibold">Who is the data controller?</h3>
      <p className="mb-4">When a business uses Kemkvitto to send you a digital receipt, that business is the data controller for your personal data. AP&amp;E Ltd acts as a data processor on their behalf.</p>

      <h3 className="mb-2 font-semibold">What data is collected</h3>
      <p className="mb-4">Only your email address is collected, along with receipt details (items, date, pickup date). No name, phone number, or other personal data is stored.</p>

      <h3 className="mb-2 font-semibold">Why it is collected</h3>
      <p className="mb-4">Your email address is used to send you a digital receipt and a pickup reminder. The legal basis is Article 6.1(b) GDPR or Article 6.1(f) GDPR.</p>

      <h3 className="mb-2 font-semibold">How long we keep it</h3>
      <p className="mb-4">Your email address is stored for 90 days following your most recent receipt or visit. If you visit again before that period expires, the 90-day period renews. We perform regular automatic purges to minimise data retention.</p>

      <h3 className="mb-2 font-semibold">Your rights</h3>
      <p className="mb-8">Under GDPR you have the right to access, correct, or delete your data, object to processing, and lodge a complaint with your local data protection authority. Contact us at <a href="mailto:legal@kemkvitto.se" className="underline">legal@kemkvitto.se</a>.</p>

      <h2 className="mb-4 text-xl font-bold">Cookies</h2>
      <p className="mb-2">We use two types of cookies:</p>
      <ul className="mb-8 list-disc pl-6 space-y-1">
        <li><strong>Strictly necessary</strong> — required for login sessions and security. Cannot be declined.</li>
        <li><strong>Analytics</strong> — anonymised page view and visitor statistics via Vercel Analytics. Can be declined via the cookie banner.</li>
      </ul>

      <h2 className="mb-4 text-xl font-bold">Data Security</h2>
      <p className="mb-8">We implement appropriate technical and organisational measures to protect personal data. All data is transmitted over encrypted connections (HTTPS).</p>

      <h2 className="mb-4 text-xl font-bold">Changes to This Policy</h2>
      <p className="mb-8">We may update this Policy from time to time. Business customers will be notified of material changes by email.</p>

      <h2 className="mb-4 text-xl font-bold">Contact</h2>
      <p>legal@kemkvitto.se<br />AP&amp;E Ltd, 5-9 Main Street, Gibraltar GX11 1AA</p>
    </div>
  );
}
