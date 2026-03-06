import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ZapierAuth from "./pages/ZapierAuth";
import PersonalizedLanding from "./pages/PersonalizedLanding";
import HomePage from "./pages/HomePage";
import SnovioPartner from "./pages/SnovioPartner";
import MailchimpPartner from "./pages/MailchimpPartner";
import WineVideoTemplate from "./pages/WineVideoTemplate";
import BuilderPage from "./pages/BuilderPage";
import BuilderPreview from "./pages/BuilderPreview";
import AdminDashboard from "./pages/AdminDashboard";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import MailchimpCallback from "./pages/MailchimpCallback";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import AuthenticatedChatBubble from "./components/AuthenticatedChatBubble";

const queryClient = new QueryClient();

function RedirectToBuilder() {
  const { slug } = useParams();
  return <Navigate to={`/builder/${slug}`} replace />;
}

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/snovio" element={<SnovioPartner />} />
          <Route path="/mailchimp" element={<MailchimpPartner />} />
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
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/admin/edit/:slug" element={<RedirectToBuilder />} />
          <Route path="/wine-video" element={<WineVideoTemplate />} />
          <Route path="/view/:token" element={<PersonalizedLanding />} />
          <Route path="/template-editor/:slug" element={<RedirectToBuilder />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/builder/:slug" element={<BuilderPage />} />
          <Route path="/builder-preview/:slug" element={<BuilderPreview />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <AuthenticatedChatBubble />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
