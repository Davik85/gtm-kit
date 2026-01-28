import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies Policy — LaunchStencil",
  description: "LaunchStencil cookies usage details.",
};

export default function CookiesPage() {
  return (
    <>
      <h1>Cookies Policy</h1>
      <p>Effective date: 28 January 2026</p>
      <p>
        We use cookies and similar technologies to make LaunchStencil work
        properly and securely.
      </p>

      <h2>Essential cookies</h2>
      <p>
        These cookies are necessary for security and fraud prevention, session
        management, and basic site functionality.
      </p>

      <h2>Non-essential cookies</h2>
      <p>
        If we add analytics or marketing cookies in the future, we will update
        our policies and request consent where required.
      </p>

      <p>
        You can control cookies through your browser settings. Disabling
        essential cookies may affect site functionality.
      </p>

      <h2>Contact</h2>
      <p>Contact: support@launchstencil.com</p>
    </>
  );
}
