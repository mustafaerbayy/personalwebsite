import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  // Create admin client
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Verify the user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Oturum bilgisi eksik.");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user?.email) {
      throw new Error("Kullanıcı kimliği doğrulanamadı.");
    }

    const userId = user.id;
    const userEmail = user.email;

    // Parse request body for verification code
    let verificationCode = "";
    try {
      const body = await req.json();
      verificationCode = body.code || "";
    } catch {
      throw new Error("Doğrulama kodu gereklidir.");
    }

    if (!verificationCode) {
      throw new Error("Doğrulama kodu gereklidir.");
    }

    // Verify the code against the database
    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from("delete_account_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("code", verificationCode)
      .single();

    if (codeError || !codeRecord) {
      throw new Error("Geçersiz doğrulama kodu.");
    }

    // Check if code is expired
    if (new Date(codeRecord.expires_at) < new Date()) {
      // Delete expired code
      await supabaseAdmin
        .from("delete_account_codes")
        .delete()
        .eq("user_id", userId);
      throw new Error("Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod isteyin.");
    }

    // Delete the used code
    await supabaseAdmin
      .from("delete_account_codes")
      .delete()
      .eq("user_id", userId);

    console.log(`Deleting account for: ${userEmail} (${userId})`);

    // 1. Fetch ALL user data for backup (full columns, not just summary fields)
    const { data: applications } = await supabaseAdmin
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const { data: departments } = await supabaseAdmin
      .from("departments")
      .select("*")
      .eq("user_id", userId);

    const { data: appFiles } = await supabaseAdmin
      .from("application_files")
      .select("*")
      .eq("user_id", userId);

    const { data: reminders } = await supabaseAdmin
      .from("reminders")
      .select("*")
      .eq("user_id", userId);

    const { data: cvContent } = await supabaseAdmin
      .from("cv_content")
      .select("*")
      .eq("user_id", userId);

    const appCount = applications?.length || 0;

    // 2. Build complete data backup
    const dataBackup = {
      user_id: userId,
      email: userEmail,
      backed_up_at: new Date().toISOString(),
      profile: profile || null,
      applications: applications || [],
      departments: departments || [],
      application_files: appFiles || [],
      reminders: reminders || [],
      cv_content: cvContent || [],
    };

    // 3. Build summary email
    const statusLabels: Record<string, string> = {
      basvuruldu: "Başvuruldu",
      online_degerlendirme: "Online Değerlendirme",
      ik_mulakati: "İK Mülakatı",
      teknik_degerlendirme: "Teknik Değerlendirme",
      kabul: "Kabul",
      reddedildi: "Reddedildi",
    };

    let appsHtml = "";
    if (applications && applications.length > 0) {
      for (const app of applications) {
        const statusText = statusLabels[app.status] || app.status;
        const appliedDate = app.applied_date
          ? new Date(app.applied_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
          : "Belirtilmemiş";

        appsHtml += `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${app.institution_name}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${app.program_name}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">
              <span style="background:#f3f4f6;padding:2px 8px;border-radius:10px;font-size:12px;color:#4b5563;">${statusText}</span>
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${appliedDate}</td>
          </tr>
        `;
      }
    }

    const acceptedCount = applications?.filter(a => a.status === "kabul").length || 0;
    const rejectedCount = applications?.filter(a => a.status === "reddedildi").length || 0;
    const activeCount = applications?.filter(a => !["kabul", "reddedildi"].includes(a.status)).length || 0;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:32px 24px;text-align:center;">
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="color:white;font-weight:800;font-size:18px;">BT</span>
      </div>
      <h1 style="color:white;font-size:22px;margin:0;font-weight:700;">Hesap Silme Özeti</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:8px 0 0 0;">Hesabınız başarıyla silindi</p>
    </div>

    <div style="padding:32px 24px;">
      <!-- User Info -->
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:24px;">
        <h3 style="margin:0 0 8px 0;color:#991b1b;font-size:14px;">Hesap Bilgileri</h3>
        <p style="margin:0;color:#374151;font-size:13px;"><strong>Ad:</strong> ${profile?.full_name || "Belirtilmemiş"}</p>
        <p style="margin:4px 0 0;color:#374151;font-size:13px;"><strong>E-posta:</strong> ${userEmail}</p>
        ${profile?.phone ? `<p style="margin:4px 0 0;color:#374151;font-size:13px;"><strong>Telefon:</strong> ${profile.phone}</p>` : ""}
        <p style="margin:4px 0 0;color:#374151;font-size:13px;"><strong>Silinme Tarihi:</strong> ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      </div>

      <!-- Stats -->
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:800;color:#374151;">${appCount}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Toplam Başvuru</p>
        </div>
        <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:800;color:#16a34a;">${acceptedCount}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Kabul</p>
        </div>
        <div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:800;color:#dc2626;">${rejectedCount}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Ret</p>
        </div>
        <div style="flex:1;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:800;color:#d97706;">${activeCount}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Aktif</p>
        </div>
      </div>

      <!-- Applications Table -->
      ${appCount > 0 ? `
      <h3 style="margin:0 0 12px 0;color:#374151;font-size:15px;">Başvuru Detayları</h3>
      <div style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:10px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Kurum</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Program</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Durum</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Tarih</th>
            </tr>
          </thead>
          <tbody>
            ${appsHtml}
          </tbody>
        </table>
      </div>
      ` : `<p style="color:#6b7280;font-size:14px;text-align:center;padding:20px;">Hiç başvuru kaydı bulunamadı.</p>`}

      <!-- Notes Section -->
      ${applications?.some(a => a.notes) ? `
      <h3 style="margin:24px 0 12px 0;color:#374151;font-size:15px;">Başvuru Notları</h3>
      ${applications.filter(a => a.notes).map(a => `
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px;">
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#4b5563;">${a.institution_name} - ${a.program_name}</p>
          <p style="margin:0;font-size:13px;color:#6b7280;">${a.notes}</p>
        </div>
      `).join("")}
      ` : ""}

      <!-- Recovery Info -->
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-top:24px;">
        <p style="margin:0;color:#1e40af;font-size:13px;">
          ℹ️ Verileriniz yedeklenmiştir. Hesabınızı geri yüklemek isterseniz, yönetici ile iletişime geçebilirsiniz.
          Yedek veriler güvenli bir şekilde saklanmaktadır.
        </p>
      </div>

      <!-- Warning -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-top:12px;">
        <p style="margin:0;color:#92400e;font-size:13px;">
          ⚠️ Bu e-posta hesabınızın silinmesi sebebiyle gönderilmiştir.
          Bu e-posta adresine ait yeni bir hesap oluşturabilmek için <strong>24 saat</strong> beklemeniz gerekmektedir.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e5e7eb;padding:20px 24px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        Bu e-posta Başvuru Takip platformu tarafından gönderilmiştir.
      </p>
    </div>
  </div>
</body>
</html>`;

    // 4. Send summary email via Resend
    if (RESEND_API_KEY) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Başvuru Takip <info@mustafaerbay.online>",
          to: [userEmail],
          subject: `Hesap Silme Özeti – ${appCount} Başvuru Kaydı`,
          html: emailHtml,
        }),
      });

      const emailResText = await emailRes.text();
      console.log(`Summary email response (${emailRes.status}):`, emailResText);
    }

    // 5. Record in deleted_accounts with full data backup
    const cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: deleteRecordError } = await supabaseAdmin
      .from("deleted_accounts")
      .insert({
        email: userEmail,
        cooldown_until: cooldownUntil,
        application_count: appCount,
        summary_sent: !!RESEND_API_KEY,
        data_backup: dataBackup,
      });

    if (deleteRecordError) {
      console.error("Error recording deletion:", deleteRecordError);
    }

    // 6. Delete the auth user (CASCADE will clean up all related table data)
    // NOTE: Storage files are intentionally NOT deleted so they can be recovered.
    // The files in 'application-files' bucket remain intact with their original paths
    // stored in data_backup.application_files[].file_path
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error("Error deleting auth user:", deleteUserError);
      throw new Error("Hesap silinirken bir hata oluştu: " + deleteUserError.message);
    }

    console.log(`Account ${userEmail} successfully deleted. Data backed up.`);

    return new Response(
      JSON.stringify({ success: true, message: "Hesabınız başarıyla silindi." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Delete account error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
