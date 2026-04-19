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

    // Generate a 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Delete any existing codes for this user
    await supabaseAdmin
      .from("delete_account_codes")
      .delete()
      .eq("user_id", userId);

    // Insert new code
    const { error: insertError } = await supabaseAdmin
      .from("delete_account_codes")
      .insert({
        user_id: userId,
        email: userEmail,
        code: code,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Error inserting delete code:", insertError);
      throw new Error("Doğrulama kodu oluşturulurken bir hata oluştu.");
    }

    // Send email via Resend
    if (!RESEND_API_KEY) {
      throw new Error("E-posta servisi yapılandırılmamış.");
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:32px 24px;text-align:center;">
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="color:white;font-weight:800;font-size:18px;">BT</span>
      </div>
      <h1 style="color:white;font-size:22px;margin:0;font-weight:700;">Hesap Silme Onayı</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:8px 0 0 0;">Dikkatli olun, bu işlem geri alınamaz</p>
    </div>
    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Merhaba,<br/><br/>
        Hesabınızı silmek için bir talep aldık. İşlemi onaylamak için aşağıdaki doğrulama kodunu kullanın:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#fef2f2,#fecaca);border:2px solid #f87171;border-radius:12px;padding:16px 32px;">
          <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#dc2626;">${code}</span>
        </div>
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-top:16px;">
        <p style="margin:0;color:#991b1b;font-size:13px;">
          ⚠️ Bu kod <strong>10 dakika</strong> boyunca geçerlidir. Hesabınız silindikten sonra tüm verileriniz kalıcı olarak silinecektir ve bu e-posta adresiyle 24 saat boyunca yeni hesap oluşturulamayacaktır.
        </p>
      </div>
      <p style="color:#6b7280;font-size:13px;margin-top:16px;text-align:center;">
        Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
      </p>
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

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Başvuru Takip <info@mustafaerbay.online>",
        to: [userEmail],
        subject: "Hesap Silme Doğrulama Kodu",
        html: emailHtml,
      }),
    });

    const emailResText = await emailRes.text();
    console.log(`Delete code email response (${emailRes.status}):`, emailResText);

    if (!emailRes.ok) {
      throw new Error("Doğrulama kodu e-postası gönderilemedi.");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Doğrulama kodu e-posta adresinize gönderildi." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Send delete code error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
