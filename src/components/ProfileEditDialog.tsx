import { useState, useEffect, useRef } from "react";
import { useAuth, Profile } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Mail, Phone, FileText, Lock, Save, Loader2, Trash2, AlertTriangle, ShieldAlert, KeyRound } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ProfileEditDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileEditDialog({ open, onClose }: ProfileEditDialogProps) {
  const { user, profile, updateProfile, updateEmail, updatePassword, sendDeleteCode, deleteAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  
  // Delete account states
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"confirm" | "code" | "ready">("confirm");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Security fields
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
    }
    if (user) {
      setNewEmail(user.email || "");
    }
  }, [profile, user, open]);

  // Reset delete states when dialog closes
  useEffect(() => {
    if (!open) {
      setDeleteConfirmText("");
      setDeleteStep("confirm");
      setVerificationCode("");
      setCodeSent(false);
      setCooldown(0);
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
    }
  }, [open]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (cooldownRef.current) clearInterval(cooldownRef.current);
      };
    }
  }, [cooldown]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile({
        full_name: fullName,
        phone: phone || null,
        bio: bio || null,
      });
      toast.success("Profil başarıyla güncellendi!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast.info("E-posta adresiniz zaten aynı.");
      return;
    }
    setLoading(true);
    try {
      await updateEmail(newEmail);
      toast.success("E-posta değişikliği için doğrulama kodu gönderildi!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(newPassword);
      toast.success("Şifreniz başarıyla değiştirildi!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDeleteCode = async () => {
    if (deleteConfirmText !== "HESABİMİ SİL") {
      toast.error('Lütfen "HESABİMİ SİL" yazarak onaylayın.');
      return;
    }
    setIsSendingCode(true);
    try {
      await sendDeleteCode();
      toast.success("Doğrulama kodu e-posta adresinize gönderildi!");
      setCodeSent(true);
      setDeleteStep("code");
      setCooldown(60); // 60 second cooldown for resend
    } catch (err: any) {
      toast.error(err.message || "Doğrulama kodu gönderilemedi.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Lütfen 6 haneli doğrulama kodunu girin.");
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount(verificationCode);
      toast.success("Hesabınız silindi. Özet e-posta gönderildi.");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Hesap silinirken bir hata oluştu.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmTextValid = deleteConfirmText === "HESABİMİ SİL";
  const isCodeValid = verificationCode.length === 6;

  const tabs = [
    { id: "profile" as const, label: "Profil", icon: User },
    { id: "security" as const, label: "Güvenlik", icon: Lock },
  ];

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-display font-bold">Hesap Ayarları</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="px-6 flex gap-1 bg-muted/50 rounded-lg mx-6 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 space-y-5">
          {activeTab === "profile" && (
            <>
              {/* Avatar Placeholder */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-primary">
                    {fullName
                      ? fullName
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "?"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{fullName || "İsimsiz"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Ad Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      placeholder="Adınız ve soyadınız"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      placeholder="+90 5XX XXX XX XX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-bio">Hakkında</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      id="profile-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none"
                      placeholder="Kendiniz hakkında kısa bir açıklama..."
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="w-full h-11"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Profili Kaydet
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Email Change */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  E-posta Değiştir
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Yeni E-posta</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Yeni e-posta adresiniz"
                  />
                </div>
                <Button
                  onClick={handleChangeEmail}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "E-postayı Güncelle"
                  )}
                </Button>
              </div>

              <Separator />

              {/* Password Change */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Şifre Değiştir
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Yeni Şifre</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Şifre Tekrar</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Şifreyi tekrar girin"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Şifreyi Güncelle"
                  )}
                </Button>
              </div>

              <Separator />

              {/* Delete Account - Multi-step */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Tehlikeli Bölge
                </h3>
                <div className="rounded-xl border-2 border-destructive/20 bg-destructive/5 p-4 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Hesabınızı sildiğinizde tüm başvurularınız, dosyalarınız ve profiliniz <strong>kalıcı olarak</strong> silinecektir.
                    Silme işlemi sonrası verilerin özetini içeren bir e-posta gönderilecek ve bu e-posta adresiyle <strong>24 saat</strong> boyunca
                    yeni hesap oluşturulamayacaktır.
                  </p>

                  {/* Step 1: Type HESABİMİ SİL */}
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirm" className="text-xs text-destructive flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Onaylamak için <strong>HESABİMİ SİL</strong> yazın
                    </Label>
                    <Input
                      id="delete-confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="HESABİMİ SİL"
                      className="border-destructive/30 focus-visible:ring-destructive/30"
                      disabled={deleteStep === "code" || deleteStep === "ready"}
                    />
                  </div>

                  {/* Step 1 Button: Send Code */}
                  {deleteStep === "confirm" && (
                    <Button
                      onClick={handleSendDeleteCode}
                      disabled={!isConfirmTextValid || isSendingCode}
                      variant="outline"
                      className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {isSendingCode ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      {isSendingCode ? "Kod gönderiliyor..." : "Doğrulama Kodu Gönder"}
                    </Button>
                  )}

                  {/* Step 2: Enter verification code */}
                  {(deleteStep === "code" || deleteStep === "ready") && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>
                          <strong>{user?.email}</strong> adresine doğrulama kodu gönderildi.
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="delete-code" className="text-xs text-destructive flex items-center gap-1.5">
                          <KeyRound className="h-3.5 w-3.5" />
                          6 haneli doğrulama kodunu girin
                        </Label>
                        <Input
                          id="delete-code"
                          value={verificationCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setVerificationCode(val);
                          }}
                          placeholder="000000"
                          className="border-destructive/30 focus-visible:ring-destructive/30 text-center text-lg font-mono tracking-[0.3em]"
                          maxLength={6}
                          inputMode="numeric"
                        />
                      </div>

                      {/* Resend button */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSendDeleteCode}
                          disabled={cooldown > 0 || isSendingCode}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cooldown > 0
                            ? `Tekrar gönder (${cooldown}s)`
                            : "Kodu tekrar gönder"}
                        </button>
                      </div>

                      {/* Step 3: Final delete button */}
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || !isCodeValid}
                        variant="destructive"
                        className="w-full"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hesabımı Kalıcı Olarak Sil
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

