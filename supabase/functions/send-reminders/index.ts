import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers for Edge Functions
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  // Use Service Role Key to bypass RLS and fetch user email
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const now = new Date().toISOString();

    // 1. Fetch due and unsent reminders
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select(`
        id,
        remind_before,
        remind_at,
        application_id,
        user_id
      `)
      .eq("sent", false)
      .lte("remind_at", now);

    if (remindersError) throw remindersError;

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders due" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const results = [];

    for (const reminder of reminders) {
      try {
        // 2. Fetch application details
        const { data: app, error: appError } = await supabase
          .from("applications")
          .select("institution_name, program_name, important_date, important_date_label")
          .eq("id", reminder.application_id)
          .single();

        if (appError) throw appError;

        // 3. Fetch user email (Internal auth query)
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          reminder.user_id
        );

        if (userError || !userData.user?.email) {
          console.error(`User email not found for ${reminder.user_id}`);
          continue;
        }

        const userEmail = userData.user.email;
        const importantDate = new Date(app.important_date).toLocaleDateString('tr-TR');

        // 4. Send email via Resend
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Başvuru Takip <onboarding@resend.dev>",
            to: [userEmail],
            subject: `Hatırlatma: ${app.institution_name} - ${app.important_date_label}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #4f46e5;">Başvuru Hatırlatıcı</h1>
                <p>Merhaba,</p>
                <p><strong>${app.institution_name}</strong> bünyesindeki <strong>${app.program_name}</strong> başvurunuzun 
                <strong>${app.important_date_label}</strong> tarihi yaklaşıyor.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Tarih:</strong> ${importantDate}</p>
                </div>
                <p>Başarılar dileriz!</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
                <small style="color: #6b7280;">Bu mail otomatik olarak gönderilmiştir.</small>
              </div>
            `,
          }),
        });

        if (res.ok) {
          // 5. Update reminder status
          await supabase
            .from("reminders")
            .update({ sent: true })
            .eq("id", reminder.id);
          
          results.push({ id: reminder.id, status: "sent" });
        } else {
          const err = await res.text();
          throw new Error(`Resend error: ${err}`);
        }
      } catch (innerError) {
        console.error(`Error processing reminder ${reminder.id}:`, innerError);
        results.push({ id: reminder.id, status: "error", error: innerError.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
