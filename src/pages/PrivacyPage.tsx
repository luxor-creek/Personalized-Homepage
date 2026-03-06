import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 py-4">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link to="/"><BrandLogo className="h-7" /></Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Home</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Operated by Kicker Inc. · Last Updated: March 10, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-foreground/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Overview</h2>
            <p>Kicker Inc. ("we", "our", or "us") operates the Personalized.Page platform. This Privacy Policy explains how we collect, use, and protect information when users create or interact with personalized pages hosted on our platform.</p>
            <p>We handle personal information in accordance with applicable Canadian privacy laws, including PIPEDA.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">Account Information</h3>
            <p>When you create an account or use the platform, we may collect your name, email address, login credentials, and account preferences.</p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">Content Created on the Platform</h3>
            <p>We collect information you upload or generate when using the service, including personalized page content, text, images, files, and personalization fields used to tailor pages for recipients.</p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">Usage Information</h3>
            <p>We automatically collect certain technical data when the platform is used, such as IP address, browser type, device type, pages accessed, and timestamps.</p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">Page Engagement Data</h3>
            <p>When a recipient views a Personalized.Page, the platform may record page visits, viewing duration, clicks or interactions with page elements, and device or browser type. This engagement information may be visible to the user who created the page.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. How We Use Information</h2>
            <p>We use collected information to operate and maintain the platform, host and deliver personalized pages, provide engagement analytics to users, improve platform performance and reliability, prevent fraud or abuse, and communicate with users about their accounts.</p>
            <p className="font-medium">We do not sell personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. AI and Automated Tools</h2>
            <p>Certain features of Personalized.Page may use artificial intelligence to assist in generating or formatting page content. Any content generated through these tools is controlled and published by the user. Users remain responsible for reviewing and approving generated content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Cookies and Tracking</h2>
            <p>Personalized Pages may use cookies and similar technologies to maintain login sessions, improve system performance, measure engagement with personalized pages, and analyze platform usage patterns. Most browsers allow users to control or disable cookies through browser settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Data Storage</h2>
            <p>Information may be stored on secure servers operated by Kicker Inc. or trusted infrastructure providers. Depending on infrastructure providers, information may be processed in Canada, the United States, or other jurisdictions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Data Security</h2>
            <p>We implement reasonable administrative, technical, and organizational safeguards to protect personal information from unauthorized access, disclosure, or loss. However, no internet-based system can guarantee complete security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Data Retention</h2>
            <p>We retain information only as long as necessary to operate and maintain the service, provide analytics and engagement metrics, and comply with legal or regulatory obligations. Users may request deletion of their account and associated data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">9. Responsibilities of Platform Users</h2>
            <p>Users who create Personalized Pages are responsible for ensuring that their communications and use of recipient information comply with applicable laws, including Canada's Anti-Spam Legislation (CASL) and relevant privacy regulations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">10. Your Privacy Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to request access to personal information we hold, request correction of inaccurate information, or request deletion of your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. The revised version will be posted on this page with an updated revision date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">12. Contact</h2>
            <p>For privacy inquiries or requests:</p>
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
