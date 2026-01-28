import type { Metadata } from "next";
import LegalContainer from "@/components/LegalContainer";

export const metadata: Metadata = {
  title: "Pricing — LaunchStencil",
  description: "LaunchStencil pricing plans and delivery details.",
};

export default function PricingPage() {
  return (
    <LegalContainer>
      <section className="space-y-6">
        <h1>LaunchStencil Pricing</h1>

        <div className="space-y-2">
          <h2>Product</h2>
          <p>AI-generated Go-To-Market (GTM) plan based on your brief.</p>
        </div>

        <div className="space-y-2">
          <h2>What you get in every plan</h2>
          <ul>
            <li>A structured GTM plan tailored to your product and market.</li>
            <li>
              Positioning, target segments, channel plan, messaging, and a 30-day
              action plan.
            </li>
            <li>
              A shareable result page and a downloadable file (if available in
              your flow).
            </li>
            <li>Email delivery of your result link.</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h2>Plans</h2>

          <div className="space-y-2">
            <h3>Base — €50</h3>
            <p>Delivery time: about 10 minutes (typical).</p>
            <p>Includes:</p>
            <ul>
              <li>One AI-generated GTM plan from your submitted brief.</li>
              <li>Access link to view your plan online.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3>Plus — €200</h3>
            <p>Delivery time: about 10 minutes (typical).</p>
            <p>Includes:</p>
            <ul>
              <li>Everything in Base.</li>
              <li>
                Follow-up Q&amp;A on your plan (you can ask clarifying questions
                after receiving the plan). Availability and format of Q&amp;A are
                described during checkout / on the result page.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3>Pro — €500</h3>
            <p>Delivery time: agreed individually.</p>
            <p>Includes:</p>
            <ul>
              <li>Human review of your brief and plan.</li>
              <li>
                Extended GTM plan with additional notes and practical additions.
              </li>
              <li>
                Optional landing page outlines / wireframe-level sketches (scope
                is agreed by email after purchase).
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <h2>Taxes (VAT)</h2>
          <p>
            Prices are shown in EUR. VAT may be added depending on your country
            and tax rules applied at checkout.
          </p>
        </div>

        <div className="space-y-2">
          <h2>Support</h2>
          <p>Questions: support@launchstencil.com</p>
        </div>
      </section>
    </LegalContainer>
  );
}
