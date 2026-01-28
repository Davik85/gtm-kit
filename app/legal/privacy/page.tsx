import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — LaunchStencil",
  description: "LaunchStencil privacy policy and data practices.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Effective date: 28 January 2026</p>
      <p>
        This Privacy Policy explains how LaunchStencil collects and uses
        personal data when you use our Service.
      </p>

      <h2>1. Data controller</h2>
      <p>
        Controller: David Tsiklauri pr Beograd (sole proprietor)
        <br />
        Address: Studentski Trg 4, Floor 7, Belgrade (Stari Grad), 11000, Serbia
        <br />
        Email: support@launchstencil.com
      </p>

      <h2>2. What data we collect</h2>
      <p>We may collect:</p>
      <ul>
        <li>
          Account/order data: email address, order ID, plan tier, timestamps.
        </li>
        <li>
          Brief data: the answers you submit in the brief (may include business
          information).
        </li>
        <li>
          Technical data: IP address, device/browser info, logs necessary for
          security and troubleshooting.
        </li>
        <li>
          Payment data: payments are processed by our payment provider. We do
          not store full card details. We may store transaction identifiers and
          payment status.
        </li>
      </ul>

      <h2>3. How we use your data (purposes)</h2>
      <p>We use personal data to:</p>
      <ul>
        <li>
          Provide the Service (create orders, generate your plan, deliver access
          links).
        </li>
        <li>
          Send service emails (result link, status updates, support messages).
        </li>
        <li>Prevent fraud and secure the Service.</li>
        <li>Maintain logs for debugging and reliability.</li>
        <li>Comply with legal obligations (tax/accounting where applicable).</li>
      </ul>

      <h2>4. Legal bases (GDPR)</h2>
      <p>When GDPR applies, our legal bases are:</p>
      <ul>
        <li>Contract: to provide the Service you requested.</li>
        <li>
          Legitimate interests: security, fraud prevention, service improvement.
        </li>
        <li>Legal obligation: compliance with applicable laws.</li>
        <li>
          Consent: only where required (for example, non-essential cookies, if
          used).
        </li>
      </ul>

      <h2>5. Where data is stored and processed</h2>
      <p>
        We store core application data in the EU (database and hosting as
        configured).
      </p>
      <p>
        We use service providers for payment processing, email delivery, AI
        generation, and hosting/monitoring.
      </p>
      <p>
        Some providers may process data outside the European Economic Area. When
        this happens, we use appropriate safeguards required by GDPR (for
        example, contractual protections) to protect data.
      </p>

      <h2>6. Sharing of data</h2>
      <p>
        We share data only with payment provider, email provider, AI provider,
        hosting and monitoring providers, and authorities if required by law.
      </p>

      <h2>7. Data retention</h2>
      <p>
        We keep personal data only as long as needed to provide access and
        support, and to comply with legal obligations. You can request deletion,
        and we will delete or anonymize data unless we must keep it for legal
        reasons.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on your location, you may have the right to access, correct,
        delete, restrict or object to processing, data portability, and to
        withdraw consent (where processing is based on consent).
      </p>
      <p>To exercise rights, email support@launchstencil.com.</p>
      <p>
        If you are in the EEA/UK, you also have the right to lodge a complaint
        with your local data protection authority.
      </p>

      <h2>9. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect
        personal data.
      </p>

      <h2>10. Cookies</h2>
      <p>
        We use cookies that are necessary for the website to function (for
        example, session and security cookies). If we add analytics or marketing
        cookies in the future, we will update this policy and, where required,
        request consent.
      </p>

      <h2>11. Contact</h2>
      <p>Email: support@launchstencil.com</p>
    </>
  );
}
