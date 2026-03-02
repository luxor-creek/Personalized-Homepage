import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import PersonalizedLanding from "./pages/PersonalizedLanding";

import TemplateEditor from "./pages/TemplateEditor";
import WineVideoTemplate from "./pages/WineVideoTemplate";
import BuilderPage from "./pages/BuilderPage";
import BuilderPreview from "./pages/BuilderPreview";
import AdminDashboard from "./pages/AdminDashboard";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import MailchimpCallback from "./pages/MailchimpCallback";
import AuthenticatedChatBubble from "./components/AuthenticatedChatBubble";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/police-recruitment" element={<Index />} />
          <Route path="/wine-video-landing" element={<WineVideoTemplate />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/auth/mailchimp/callback" element={<MailchimpCallback />} />
          <Route path="/admin/edit/:slug" element={<TemplateEditor />} />
          
          <Route path="/wine-video" element={<WineVideoTemplate />} />
          <Route path="/view/:token" element={<PersonalizedLanding />} />
          <Route path="/template-editor/:slug" element={<TemplateEditor />} />
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
