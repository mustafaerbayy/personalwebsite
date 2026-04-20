import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, KeyRound, Eye, EyeOff } from "lucide-react";

const SHORTCUT_MAP: Record<string, string> = {
  m: "mustafaeerbay@gmail.com",
};

type AuthView = "login" | "register" | "verify-otp" | "forgot-password" | "reset-verify";

export default function LoginPage() {
  const { signIn, signUp, verifyOtp, resetPassword, checkDeletedEmail } = useAuth();
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const resolvedEmail = SHORTCUT_MAP[email.trim().toLowerCase()] || email;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(resolvedEmail, password);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setLoading(true);
    try {
      // Check if this email is in cooldown from a recent deletion
      const cooldownCheck = await checkDeletedEmail(resolvedEmail);
      if (cooldownCheck.blocked) {
        toast.error(
          `Bu e-posta adresi yakın zamanda silinmiş bir hesaba aittir. Yeni kayıt oluşturabilmek için yaklaşık ${cooldownCheck.hoursLeft || 24} saat beklemeniz gerekmektedir.`
        );
        setLoading(false);
        return;
      }
      await signUp(resolvedEmail, password, fullName);
      setPendingEmail(resolvedEmail);
      setView("verify-otp");
      toast.success("Doğrulama kodu e-posta adresinize gönderildi!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(pendingEmail, otpCode, "signup");
      toast.success("Hesabınız başarıyla doğrulandı! Giriş yapılıyor...");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(resolvedEmail);
      setPendingEmail(resolvedEmail);
      setView("reset-verify");
      toast.success("Şifre sıfırlama kodu e-posta adresinize gönderildi!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(pendingEmail, otpCode, "recovery");
      toast.success("Doğrulama başarılı! Şimdi yeni şifrenizi belirleyebilirsiniz.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    setOtpCode("");
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background relative overflow-hidden">
      {/* Premium Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] sm:w-[50%] sm:h-[50%] rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[25%] -right-[10%] w-[70%] h-[70%] sm:w-[50%] sm:h-[50%] rounded-full bg-gradient-to-tr from-blue-500/30 to-primary/30 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10 px-4 sm:px-6 py-12">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 hover:from-primary/30 hover:to-primary/10 transition-colors border border-primary/20 shadow-xl shadow-primary/10 backdrop-blur-md mb-2 group">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="relative text-2xl font-bold text-primary">BT</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Başvuru Takip</h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* LOGIN */}
          {view === "login" && (
            <motion.div key="login" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-3xl border border-white/10 dark:border-white/5 bg-white/60 dark:bg-black/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 ring-1 ring-border/50">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground/80">Hesabınıza giriş yapın</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1">E-posta</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="text"
                        placeholder="E-posta"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 bg-white/50 dark:bg-black/50 border-white/20 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all text-base sm:text-sm rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Şifre</Label>
                      <button
                        type="button"
                        onClick={() => switchView("forgot-password")}
                        className="text-xs font-medium text-primary/80 hover:text-primary transition-colors"
                      >
                        Unuttum?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12 bg-white/50 dark:bg-black/50 border-white/20 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all text-base sm:text-sm rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold text-base sm:text-sm rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 shadow-lg shadow-primary/25 mt-2" disabled={loading}>
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Giriş Yap"
                    )}
                  </Button>
                </form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background/80 backdrop-blur-sm px-2 text-muted-foreground/80">Veya</span>
                  </div>
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => switchView("register")}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    Yeni hesap oluştur <ArrowLeft className="h-3 w-3 rotate-180" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* REGISTER */}
          {view === "register" && (
            <motion.div key="register" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-3xl border border-white/10 dark:border-white/5 bg-white/60 dark:bg-black/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 ring-1 ring-border/50">
                <div className="flex items-center gap-2">
                  <button onClick={() => switchView("login")} className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-medium text-muted-foreground/80">Yeni hesap oluşturun</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2.5">
                    <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1">Ad Soyad</Label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Ad Soyad"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-11 h-12 bg-white/50 dark:bg-black/50 border-white/20 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all text-base sm:text-sm rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="reg-email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1">E-posta</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="E-posta adresiniz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 bg-white/50 dark:bg-black/50 border-white/20 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all text-base sm:text-sm rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="reg-password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1">Şifre</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="En az 6 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12 bg-white/50 dark:bg-black/50 border-white/20 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all text-base sm:text-sm rounded-xl"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold text-base sm:text-sm rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 shadow-lg shadow-primary/25 mt-2" disabled={loading}>
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Kayıt Ol"
                    )}
                  </Button>
                </form>
                <div className="text-center text-sm pt-2">
                  <button
                    type="button"
                    onClick={() => switchView("login")}
                    className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Zaten hesabınız var mı? Giriş yapın
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* OTP VERIFICATION (Signup) */}
          {view === "verify-otp" && (
            <motion.div key="verify-otp" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-3xl border border-white/10 dark:border-white/5 bg-white/60 dark:bg-black/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 ring-1 ring-border/50">
                <div className="flex items-center gap-2">
                  <button onClick={() => switchView("register")} className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-medium text-muted-foreground/80">E-posta doğrulama</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
                    <KeyRound className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-foreground/80">
                    <strong className="text-foreground tracking-wide font-semibold">{pendingEmail}</strong> adresine gönderilen doğrulama kodunu girin.
                  </p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2.5">
                    <Label htmlFor="otp" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1">Doğrulama Kodu</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="text-center h-14 text-2xl tracking-[0.4em] font-mono font-bold bg-white/50 dark:bg-black/50 border-white/20 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl placeholder:tracking-normal placeholder:font-sans placeholder:text-base placeholder:font-normal"
                      required
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold text-base sm:text-sm rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 shadow-lg shadow-primary/25 mt-2" disabled={loading}>
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Doğrula"
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

          {/* FORGOT PASSWORD */}
          {view === "forgot-password" && (
            <motion.div key="forgot-password" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-3xl border border-white/10 dark:border-white/5 bg-white/60 dark:bg-black/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 ring-1 ring-border/50">
                <div className="flex items-center gap-2">
                  <button onClick={() => switchView("login")} className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-medium text-muted-foreground/80">Şifre sıfırlama</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-foreground/80">
                    E-posta adresinizi girin, şifre sıfırlama kodu göndereceğiz.
                  </p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2.5">
                    <Label htmlFor="reset-email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1">E-posta</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="reset-email"
                        type="text"
                        placeholder="E-posta adresiniz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 bg-white/50 dark:bg-black/50 border-white/20 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all text-base sm:text-sm rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold text-base sm:text-sm rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 shadow-lg shadow-primary/25 mt-2" disabled={loading}>
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Sıfırlama Kodu Gönder"
                    )}
                  </Button>
                </form>
                <div className="text-center text-sm pt-2">
                  <button
                    type="button"
                    onClick={() => switchView("login")}
                    className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Giriş sayfasına dön
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* RESET VERIFICATION */}
          {view === "reset-verify" && (
            <motion.div key="reset-verify" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-3xl border border-white/10 dark:border-white/5 bg-white/60 dark:bg-black/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 ring-1 ring-border/50">
                <div className="flex items-center gap-2">
                  <button onClick={() => switchView("forgot-password")} className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-medium text-muted-foreground/80">Şifre sıfırlama doğrulama</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-warning/10 border border-warning/20 mb-2">
                    <KeyRound className="h-8 w-8 text-warning" />
                  </div>
                  <p className="text-sm text-foreground/80">
                    <strong className="text-foreground tracking-wide font-semibold">{pendingEmail}</strong> adresine gönderilen sıfırlama kodunu girin.
                  </p>
                </div>
                <form onSubmit={handleResetVerify} className="space-y-4">
                  <div className="space-y-2.5">
                    <Label htmlFor="reset-otp" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1">Sıfırlama Kodu</Label>
                    <Input
                      id="reset-otp"
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="text-center h-14 text-2xl tracking-[0.4em] font-mono font-bold bg-white/50 dark:bg-black/50 border-white/20 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl placeholder:tracking-normal placeholder:font-sans placeholder:text-base placeholder:font-normal"
                      required
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold text-base sm:text-sm rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 shadow-lg shadow-primary/25 mt-2" disabled={loading}>
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Doğrula ve Şifre Belirle"
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}