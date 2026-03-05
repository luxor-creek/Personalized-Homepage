import { supabase } from "@/integrations/supabase/client";

export interface BetaSignupData {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone?: string;
  source?: "homepage" | "snovio" | "mailchimp";
  tool?: string;
}

export async function submitBetaSignup(data: BetaSignupData): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: result, error } = await supabase.functions.invoke("send-beta-notification", {
      body: data,
    });

    if (error) {
      console.error("Beta signup error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Beta signup error:", err);
    return { success: false, error: err.message || "Something went wrong" };
  }
}
