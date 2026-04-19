import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Premium email template wrapper
function wrapInTemplate(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 24px;text-align:center;">
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="color:white;font-weight:800;font-size:18px;">BT</span>
      </div>
      <h1 style="color:white;font-size:22px;margin:0;font-weight:700;">${title}</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px 24px;">
      ${bodyHtml}
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
}

function buildConfirmationEmail(token: string, redirectTo: string): { subject: string; html: string } {
  const confirmUrl = `${redirectTo}?token=${token}&type=signup`;
  return {
    subject: "Hesabınızı Doğrulayın",
    html: wrapInTemplate("Hesabınızı Doğrulayın", `
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Merhaba,<br/><br/>
        Hesabınız başarıyla oluşturuldu! Hesabınızı aktif hale getirmek için aşağıdaki doğrulama kodunu kullanın:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px solid #c4b5fd;border-radius:12px;padding:16px 32px;">
          <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#4f46e5;">${token}</span>
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;">
        Bu kod 1 saat boyunca geçerlidir. Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
      </p>
    `),
  };
}

function buildRecoveryEmail(token: string, redirectTo: string): { subject: string; html: string } {
  return {
    subject: "Şifrenizi Sıfırlayın",
    html: wrapInTemplate("Şifre Sıfırlama", `
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Merhaba,<br/><br/>
        Şifrenizi sıfırlamak için bir talep aldık. Aşağıdaki kodu kullanarak şifrenizi değiştirebilirsiniz:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #f59e0b;border-radius:12px;padding:16px 32px;">
          <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#92400e;">${token}</span>
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;">
        Bu kod 1 saat boyunca geçerlidir. Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.
      </p>
    `),
  };
}

function buildMagicLinkEmail(token: string, redirectTo: string): { subject: string; html: string } {
  return {
    subject: "Giriş Bağlantınız",
    html: wrapInTemplate("Tek Kullanımlık Giriş", `
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Merhaba,<br/><br/>
        Hesabınıza giriş yapmak için aşağıdaki kodu kullanın:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #6ee7b7;border-radius:12px;padding:16px 32px;">
          <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#065f46;">${token}</span>
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;">
        Bu kod 1 saat boyunca geçerlidir.
      </p>
    `),
  };
}

function buildEmailChangeEmail(token: string, newEmail: string): { subject: string; html: string } {
  return {
    subject: "E-posta Değişikliğini Onaylayın",
    html: wrapInTemplate("E-posta Değişikliği", `
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Merhaba,<br/><br/>
        E-posta adresinizi <strong>${newEmail}</strong> olarak değiştirmek için bir talep aldık. Değişikliği onaylamak için aşağıdaki kodu kullanın:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px solid #93c5fd;border-radius:12px;padding:16px 32px;">
          <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#1e40af;">${token}</span>
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;">
        Bu kod 1 saat boyunca geçerlidir. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
      </p>
    `),
  };
}

function buildReauthenticationEmail(token: string): { subject: string; html: string } {
  return {
    subject: "Yeniden Kimlik Doğrulama",
    html: wrapInTemplate("Kimlik Doğrulama", `
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Merhaba,<br/><br/>
        İşleminizi tamamlamak için aşağıdaki doğrulama kodunu girin:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:2px solid #f9a8d4;border-radius:12px;padding:16px 32px;">
          <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#9d174d;">${token}</span>
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;">
        Bu kod kısa süre içinde sona erecektir.
      </p>
    `),
  };
}

function buildInviteEmail(token: string, redirectTo: string): { subject: string; html: string } {
  return {
    subject: "Davet Edildiniz",
    html: wrapInTemplate("Platforma Davet", `
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Merhaba,<br/><br/>
        Başvuru Takip platformuna davet edildiniz! Davetinizi kabul etmek için aşağıdaki kodu kullanın:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px solid #c4b5fd;border-radius:12px;padding:16px 32px;">
          <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#4f46e5;">${token}</span>
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;">
        Bu kod 1 saat boyunca geçerlidir.
      </p>
    `),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload = await req.json();

    // Supabase Send Email Hook payload structure
    // https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
    const { user, email_data } = payload;

    if (!user || !email_data) {
      return new Response(
        JSON.stringify({ error: "Invalid hook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = user.email;
    const token = email_data.token;
    const tokenHash = email_data.token_hash;
    const redirectTo = email_data.redirect_to || "https://mustafaerbay.online";
    const emailActionType = email_data.email_action_type;

    console.log(`Processing ${emailActionType} email for ${userEmail}`);

    let emailContent: { subject: string; html: string };

    switch (emailActionType) {
      case "signup":
        emailContent = buildConfirmationEmail(token, redirectTo);
        break;
      case "recovery":
        emailContent = buildRecoveryEmail(token, redirectTo);
        break;
      case "magic_link":
        emailContent = buildMagicLinkEmail(token, redirectTo);
        break;
      case "email_change":
        emailContent = buildEmailChangeEmail(token, email_data.new_email || userEmail);
        break;
      case "reauthentication":
        emailContent = buildReauthenticationEmail(token);
        break;
      case "invite":
        emailContent = buildInviteEmail(token, redirectTo);
        break;
      default:
        console.log(`Unknown email action type: ${emailActionType}, using generic template`);
        emailContent = {
          subject: "Doğrulama Kodu",
          html: wrapInTemplate("Doğrulama Kodu", `
            <p style="color:#374151;font-size:15px;line-height:1.6;">
              Doğrulama kodunuz:
            </p>
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;background:#f3f4f6;border:2px solid #d1d5db;border-radius:12px;padding:16px 32px;">
                <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#374151;">${token}</span>
              </div>
            </div>
          `),
        };
    }

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Başvuru Takip <info@mustafaerbay.online>",
        to: [userEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const resBody = await res.text();
    console.log(`Resend response (${res.status}):`, resBody);

    if (!res.ok) {
      throw new Error(`Resend API error: ${resBody}`);
    }

    // Return success — important: return empty object as Supabase hook expects
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Send email hook error:", error.message);
    // For hooks, we should return an error response that Supabase can handle
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
