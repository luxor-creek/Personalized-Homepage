export async function getMailchimpCredentials(
  supabase: any,
  userId: string
): Promise<{ apiKey: string; server: string }> {
  const { data, error } = await supabase
    .from("integration_credentials")
    .select("credentials")
    .eq("user_id", userId)
    .eq("provider", "mailchimp")
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch Mailchimp credentials: ${error.message}`);
  if (!data?.credentials?.api_key) throw new Error("Mailchimp not connected. Add your API key in Settings → Integrations.");

  const apiKey = data.credentials.api_key;
  // Mailchimp API keys end with -us21, -us14, etc. Extract the server prefix.
  const server = apiKey.split("-").pop() || "us1";

  return { apiKey, server };
}

export async function mailchimpFetch(
  apiKey: string,
  server: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://${server}.api.mailchimp.com/3.0${path}`;
  const headers: Record<string, string> = {
    "Authorization": `Basic ${btoa(`anystring:${apiKey}`)}`,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  return fetch(url, { ...options, headers });
}
