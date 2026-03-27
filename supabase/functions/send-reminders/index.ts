import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const nowObj = new Date();
    const now = nowObj.toISOString();

    let isManualTest = false;
    let body: any = {};
    if (req.method === "POST") {
      try {
        const tempReq = req.clone();
        body = await tempReq.json();
        isManualTest = body.action === "manual_test";
      } catch (e) {
        console.log("Not a manual test JSON request");
      }
    }

    if (isManualTest) {
      console.log("--- Manual Test Mode ---");
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Oturum bilgisi eksik (Authorization header).");
      
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user?.email) {
        console.error("Auth verify error:", userError);
        throw new Error("Kullanıcı kimliği doğrulanamadı.");
      }

      console.log("User verified:", user.email);

      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("institution_name, program_name, important_date, important_date_label")
        .eq("user_id", user.id)
        .not("important_date", "is", null)
        .gte("important_date", now)
        .order("important_date", { ascending: true });

      if (appsError) throw appsError;

      if (!apps || apps.length === 0) {
        return new Response(JSON.stringify({ message: "Yaklaşan herhangi bir önemli tarihiniz bulunmamaktadır." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      let emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px;">Başvuru Durum Raporunuz</h1>
          <p>Merhaba, sistemde kayıtlı yaklaşan önemli tarihli başvurularınız aşağıdadır:</p>
          <div style="margin: 25px 0;">
      `;

      for (const app of apps) {
        const impDate = new Date(app.important_date);
        const diffMs = impDate.getTime() - nowObj.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const dateStr = impDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        
        let remainingStr = '';
        if (diffDays > 0) remainingStr += `${diffDays} gün `;
        if (diffHours > 0) remainingStr += `${diffHours} saat `;
        if (diffMins > 0) remainingStr += `${diffMins} dakika`;
        remainingStr = remainingStr.trim() || 'Az kaldı!';

        emailHtml += `
          <div style="background: #f9fafb; padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 8px 0; color: #111827;">${app.institution_name}</h3>
            <p style="margin: 0 0 5px 0; color: #4b5563;"><strong>Program:</strong> ${app.program_name}</p>
            <p style="margin: 0 0 5px 0; color: #4b5563;"><strong>${app.important_date_label || 'Önemli Tarih'}:</strong> ${dateStr}</p>
            <p style="margin: 0;">
              <span style="background: #ef4444; color: white; font-weight: bold; padding: 3px 10px; border-radius: 20px; font-size: 13px;">⏰ ${remainingStr} kaldı</span>
            </p>
          </div>
        `;
      }

      emailHtml += `
          </div>
          <p>Başarılar dileriz!</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
          <small style="color: #9ca3af; display: block; text-align: center;">Bu e-posta Mustafa Erbay Başvuru Takip sistemi tarafından oluşturulmuştur.</small>
        </div>
      `;

      if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY tanımlanmamış. Lütfen secrets kısmını kontrol edin.");

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Mustafa Erbay <info@mustafaerbay.online>",
          to: [user.email],
          subject: `Başvuru Durum Raporu: ${apps.length} Başvuru için İşlem Gerekiyor`,
          html: emailHtml,
        }),
      });

      const resText = await res.text();
      console.log("Resend API response:", res.status, resText);

      if (!res.ok) throw new Error(`Resend API Hatası: ${resText}`);

      return new Response(JSON.stringify({ success: true, count: apps.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // --- Otomatik Hatırlatıcılar (Zamanlanmış) ---
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select("id, remind_before, remind_at, application_id, user_id")
      .eq("sent", false)
      .lte("remind_at", now);

    if (remindersError) throw remindersError;

    const results = [];
    for (const reminder of reminders) {
      try {
        const { data: app } = await supabase.from("applications").select("*").eq("id", reminder.application_id).single();
        const { data: userData } = await supabase.auth.admin.getUserById(reminder.user_id);
        if (!userData.user?.email || !app) continue;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "Basvuru Takip <info@mustafaerbay.online>",
            to: [userData.user.email],
            subject: `Hatırlatma: ${app.institution_name} - ${app.important_date_label}`,
            html: `<h3>Başvuru Hatırlatıcı</h3><p><strong>${app.institution_name}</strong> başvurunuz yaklaşıyor.</p>`,
          }),
        });

        if (res.ok) {
          await supabase.from("reminders").update({ sent: true }).eq("id", reminder.id);
          results.push({ id: reminder.id, status: "sent" });
        }
      } catch (err) {}
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error: any) {
    console.error("Master Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
