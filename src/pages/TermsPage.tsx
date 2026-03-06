import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 py-4">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link to="/"><BrandLogo className="h-7" /></Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Home</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Operated by Kicker Inc.</p>

        <div className="prose prose-slate max-w-none space-y-8 text-foreground/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>These Terms of Service govern your use of Personalized.Page, a software platform operated by Kicker Inc. ("Kicker", "we", "our", or "us"). By accessing or using the service, you agree to these Terms. If you do not agree, you may not use the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Description of the Service</h2>
            <p>Personalized.Page is a software platform that enables users to create personalized landing pages, digital messages, and outreach pages intended for specific recipients.</p>
            <p>Features may include personalized page creation, page hosting and delivery, engagement analytics, integrations with third-party platforms, and automation or AI-assisted content tools. We may modify or discontinue features at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Acceptable Use</h2>
            <p>You agree to use the platform lawfully and responsibly. You may not use Personalized.Page to send unsolicited mass spam or deceptive outreach, impersonate another person or organization, distribute illegal, fraudulent, or misleading content, violate privacy or intellectual property rights, harvest or scrape personal data, or attempt to access or disrupt our systems.</p>
            <p>Users are responsible for complying with applicable laws, including Canada's Anti-Spam Legislation (CASL) and other applicable regulations. Kicker Inc. may suspend or terminate accounts that violate these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. User Content</h2>
            <p>You retain ownership of the content you create using the platform. By using Personalized.Page, you grant Kicker Inc. a limited license to host, process, and display your content solely for the purpose of operating the service. You represent that you have the legal right to use all content uploaded to the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. AI-Generated Content</h2>
            <p>Certain features of Personalized.Page may use artificial intelligence to generate or assist in creating content. AI-generated content is provided as a tool for assistance only.</p>
            <p>Kicker Inc. does not guarantee the accuracy of AI-generated content, does not review all generated material, and is not responsible for how generated content is used. Users are solely responsible for reviewing and approving any content created using AI tools before publishing or distributing it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Outreach and Communications Responsibility</h2>
            <p>Personalized.Page may be used in sales, recruiting, or outreach communications. Kicker Inc. does not send communications on behalf of users and does not control how the platform is used in outreach campaigns.</p>
            <p>Users are solely responsible for ensuring that any outreach or communication activities comply with Canada's Anti-Spam Legislation (CASL), applicable marketing and privacy laws, and consent requirements for contacting recipients. Kicker Inc. is not responsible for misuse of the platform for spam or unsolicited messaging.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Engagement Analytics</h2>
            <p>Personalized.Page may collect engagement data including page visits, viewing duration, interactions or clicks, and device or browser information. This information is made available to users to understand how recipients interact with their personalized pages.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Third-Party Services</h2>
            <p>The platform may integrate with third-party tools including CRM systems, marketing platforms, analytics providers, or hosting infrastructure. Kicker Inc. is not responsible for the policies, practices, or reliability of third-party services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">9. Service Availability</h2>
            <p>The platform is provided "as is" and "as available." We do not guarantee uninterrupted service, uptime, or error-free operation.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Kicker Inc. shall not be liable for any indirect, incidental, or consequential damages resulting from the use of the platform. This includes but is not limited to loss of revenue, loss of business opportunities, data loss, and reputational damage.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">11. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Kicker Inc., its officers, employees, and affiliates from any claims, damages, liabilities, or expenses arising from your use of the platform, your content or communications, violation of these Terms, or violation of applicable laws. This includes claims related to unsolicited outreach, intellectual property violations, or misuse of the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">12. Account Termination</h2>
            <p>Kicker Inc. may suspend or terminate accounts if these Terms are violated, the platform is misused, required by law, or the service is being used in a harmful or abusive way. Users may stop using the platform at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">13. Changes to the Terms</h2>
            <p>We may update these Terms periodically. Continued use of the platform after updates are posted constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">14. Governing Law</h2>
            <p>These Terms are governed by the laws of Canada and the Province of Alberta.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">Contact</h2>
            <p>For legal inquiries:</p>
            <p className="font-medium">Kicker Inc.<br/>115 9th Avenue SW, Calgary AB<br/><a href="https://kicker.ventures" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">kicker.ventures</a></p>
          </section>
        </div>
      </main>

      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo className="h-6" />
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="https://kicker.ventures" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Kicker Ventures</a>
          </div>
          <p className="text-xs text-muted-foreground/60">&copy; {new Date().getFullYear()} <a href="https://kicker.ventures" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Kicker Ventures</a>. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
