import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AIChatAssistant from "./AIChatAssistant";

/**
 * Only renders the AI chat bubble if the user is authenticated.
 * Placed in App.tsx so it appears on every page.
 */
const AuthenticatedChatBubble = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [isPublicPage, setIsPublicPage] = useState(false);

  useEffect(() => {
    // Check if on a public-facing page where chatbot should be hidden
    const checkPath = () => {
      const path = window.location.pathname;
      setIsPublicPage(path.startsWith("/view/") || path.startsWith("/builder-preview/") || path.startsWith("/p/"));
    };
    checkPath();
    window.addEventListener("popstate", checkPath);
    return () => window.removeEventListener("popstate", checkPath);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuth(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuth(!!session);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  if (!isAuth || isPublicPage) return null;
  return <AIChatAssistant />;
};

export default AuthenticatedChatBubble;
