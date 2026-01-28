import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — LaunchStencil",
  description: "LaunchStencil Terms of Service and usage conditions.",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>Effective date: 28 January 2026</p>
      <p>
        These Terms of Service (“Terms”) govern your access to and use of the
        LaunchStencil website and services (the “Service”). By using the
        Service, you agree to these Terms.
      </p>

      <h2>1. Who we are</h2>
      <p>
        The Service is operated by:
        <br />
        David Tsiklauri pr Beograd (sole proprietor),
        <br />
        Address: Studentski Trg 4, Floor 7, Belgrade (Stari Grad), 11000,
        Serbia.
        <br />
        Registration number: 68367786. Tax ID (PIB): 115439979.
        <br />
        Support: support@launchstencil.com
      </p>

      <h2>2. The Service</h2>
      <p>
        LaunchStencil provides an AI-generated Go-To-Market plan based on
        information you submit in a brief (“Input”). The Service outputs a plan
        and related text (“Output”).
      </p>

      <h2>3. Eligibility</h2>
      <p>
        You must be legally able to enter into a contract. If you use the
        Service on behalf of a company, you confirm you have authority to bind
        that company.
      </p>

      <h2>4. Orders, payment, and access</h2>
      <ol className="list-decimal space-y-2 pl-6">
        <li>You choose a plan (Base / Plus / Pro) and pay at checkout.</li>
        <li>
          Access to the brief and/or result is provided only after payment is
          confirmed according to our payment flow.
        </li>
        <li>
          We may use access tokens or similar technical measures to protect
          access to your result link.
        </li>
      </ol>

      <h2>5. Delivery times</h2>
      <p>Delivery times are estimates:</p>
      <ul>
        <li>Base: about 10 minutes (typical)</li>
        <li>Plus: about 10 minutes (typical)</li>
        <li>Pro: agreed individually</li>
      </ul>
      <p>
        Delivery can be delayed due to technical load, payment verification, or
        brief complexity.
      </p>

      <h2>6. Your Input and responsibilities</h2>
      <p>You are responsible for:</p>
      <ul>
        <li>The accuracy of your Input.</li>
        <li>
          Ensuring you have the rights to share any materials you provide
          (including confidential information of third parties).
        </li>
        <li>
          Not submitting personal data of third parties unless you have a lawful
          basis and permission.
        </li>
      </ul>

      <h2>7. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for illegal purposes.</li>
        <li>Attempt to bypass access controls or test security.</li>
        <li>Upload malware or interfere with the Service.</li>
        <li>
          Use the Service to generate content that violates law or third-party
          rights.
        </li>
      </ul>

      <h2>8. AI limitations and “no professional advice”</h2>
      <p>
        The Output is generated with the help of automated systems and may
        contain errors, omissions, or recommendations that do not fit your exact
        context.
      </p>
      <p>
        The Service does not provide legal, financial, medical, or other
        regulated professional advice. You are responsible for decisions made
        based on the Output.
      </p>

      <h2>9. Intellectual property</h2>
      <ul>
        <li>We own the Service, its software, design, and branding.</li>
        <li>As between you and us, you retain rights to your Input.</li>
        <li>
          We grant you a non-exclusive right to use the Output for your internal
          business purposes and for your own marketing planning.
        </li>
      </ul>

      <h2>10. Service availability and changes</h2>
      <p>
        We may update, change, or discontinue parts of the Service. We may
        suspend access if we believe there is fraud, abuse, or security risk.
      </p>

      <h2>11. Refunds</h2>
      <p>
        Refund rules are described in our Refund Policy (/legal/refunds), which
        is part of these Terms.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>To the maximum extent permitted by law:</p>
      <ul>
        <li>
          We are not liable for indirect or consequential losses (lost profit,
          lost business, reputational damage).
        </li>
        <li>
          Our total liability for any claim is limited to the amount you paid
          for the relevant order.
        </li>
      </ul>
      <p>
        Nothing in these Terms limits liability where such limitation is not
        allowed by applicable law.
      </p>

      <h2>13. Consumer rights (EEA/UK)</h2>
      <p>
        If you are a consumer in the European Economic Area or the United
        Kingdom, you may have mandatory rights under consumer protection laws.
        These Terms do not limit those mandatory rights.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These Terms are governed by the laws of Serbia, and disputes are subject
        to the competent courts in Belgrade, unless mandatory consumer laws
        require otherwise.
      </p>

      <h2>15. Contact</h2>
      <p>Support: support@launchstencil.com</p>
    </>
  );
}
