import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — LaunchStencil",
  description: "LaunchStencil refund policy and eligibility details.",
};

export default function RefundsPage() {
  return (
    <>
      <h1>Refund Policy</h1>
      <p>Effective date: 28 January 2026</p>
      <p>
        This Refund Policy explains when you can request a refund for
        LaunchStencil purchases.
      </p>

      <h2>1. General rule</h2>
      <p>
        Our Service is a digital service that starts immediately after purchase
        (payment confirmation and processing). Because of this, refund rules
        depend on whether the service has started and whether the result was
        delivered.
      </p>

      <h2>2. EU/EEA/UK consumer withdrawal right (digital services)</h2>
      <p>
        If you are a consumer in the EU/EEA/UK, you may normally have a 14-day
        right to withdraw from a purchase.
      </p>
      <p>
        However, for digital services/content that begin immediately, the
        withdrawal right may be lost once performance begins, if you request
        immediate performance and acknowledge this consequence.
      </p>
      <p>
        By purchasing and using LaunchStencil, you request immediate performance
        of the Service. Once we start generating or deliver your result, refunds
        are generally not available unless required by law or unless there is a
        service failure described below.
      </p>

      <h2>3. When a refund may be granted</h2>
      <p>We may grant a full or partial refund if:</p>
      <ul>
        <li>
          We cannot deliver the Service due to a technical failure and cannot
          fix it within a reasonable time.
        </li>
        <li>You are charged incorrectly (duplicate charge).</li>
        <li>
          The Output cannot be accessed due to our technical issue and support
          cannot restore access.
        </li>
      </ul>

      <h2>4. When refunds are not granted</h2>
      <p>Refunds are generally not granted if:</p>
      <ul>
        <li>
          The result was generated and delivered, but you do not like the
          content or it does not match your expectations.
        </li>
        <li>
          You provided incorrect or incomplete Input and the Output is not
          useful for that reason.
        </li>
        <li>You changed your mind after the service started.</li>
      </ul>

      <h2>5. How to request a refund</h2>
      <p>
        Email support@launchstencil.com and include the email used at checkout,
        the order ID (if you have it), and a short explanation.
      </p>

      <h2>6. Chargebacks</h2>
      <p>
        If you start a chargeback without contacting support first, we may
        suspend access while investigating. We prefer to resolve issues directly
        with you.
      </p>

      <h2>7. Processing time</h2>
      <p>
        If a refund is approved, it is processed back to the original payment
        method. The time to appear in your account depends on your
        bank/payment method.
      </p>
    </>
  );
}
