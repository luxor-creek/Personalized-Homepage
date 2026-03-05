import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Homepage from "./pages/Homepage";
=======
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
>>>>>>> b6e0a2839107cacca5253e5f52bb42854f450ee8
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ZapierAuth from "./pages/ZapierAuth";
import PersonalizedLanding from "./pages/PersonalizedLanding";
import HomePage from "./pages/HomePage";
import SnovioPartner from "./pages/SnovioPartner";
import MailchimpPartner from "./pages/MailchimpPartner";

// Legacy TemplateEditor removed — all templates now use the Builder
// import TemplateEditor from "./pages/TemplateEditor";
import WineVideoTemplate from "./pages/WineVideoTemplate";
import BuilderPage from "./pages/BuilderPage";
import BuilderPreview from "./pages/BuilderPreview";
import AdminDashboard from "./pages/AdminDashboard";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import MailchimpCallback from "./pages/MailchimpCallback";
import AuthenticatedChatBubble from "./components/AuthenticatedChatBubble";

const queryClient = new QueryClient();

<<<<<<< HEAD
// Redirect legacy /template-editor/:slug and /admin/edit/:slug to /builder/:slug
function RedirectToBuilder() {
  const { slug } = useParams();
  return <Navigate to={`/builder/${slug}`} replace />;
}
=======
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};
>>>>>>> b6e0a2839107cacca5253e5f52bb42854f450ee8

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
<<<<<<< HEAD
          <Route path="/" element={<Homepage />} />
=======
          <Route path="/" element={<HomePage />} />
          <Route path="/snovio" element={<SnovioPartner />} />
          <Route path="/mailchimp" element={<MailchimpPartner />} />
>>>>>>> b6e0a2839107cacca5253e5f52bb42854f450ee8
          <Route path="/police-recruitment" element={<Index />} />
          <Route path="/wine-video-landing" element={<WineVideoTemplate />} />
          <Route path="/workspace" element={<Admin />} />
          <Route path="/admin" element={<Navigate to="/workspace" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/zapier" element={<ZapierAuth />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/auth/mailchimp/callback" element={<MailchimpCallback />} />
          <Route path="/admin/edit/:slug" element={<RedirectToBuilder />} />
          
          <Route path="/wine-video" element={<WineVideoTemplate />} />
          <Route path="/view/:token" element={<PersonalizedLanding />} />
          <Route path="/template-editor/:slug" element={<RedirectToBuilder />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/builder/:slug" element={<BuilderPage />} />
          <Route path="/builder-preview/:slug" element={<BuilderPreview />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <AuthenticatedChatBubble />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
