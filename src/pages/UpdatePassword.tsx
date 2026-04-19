import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, Eye, EyeOff, AlertTriangle } from "lucide-react";

export default function UpdatePasswordPage() {
  const { updatePassword, clearPasswordReset } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      toast.success("Şifreniz başarıyla güncellendi!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-warning/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-6 relative z-10 px-4">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
            <span className="text-lg font-bold text-primary">BT</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Başvuru Takip</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-lg space-y-5">
            {/* Pulsing reminder alert */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(245, 158, 11, 0)",
                  "0 0 0 8px rgba(245, 158, 11, 0.15)",
                  "0 0 0 0 rgba(245, 158, 11, 0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-warning">Şifrenizi Güncelleyin</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Güvenliğiniz için lütfen yeni bir şifre belirleyin.
                </p>
              </div>
            </motion.div>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Kimliğiniz doğrulandı. Şimdi yeni şifrenizi belirleyin.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pw">Yeni Şifre</Label>
                <motion.div
                  className="relative"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(79, 70, 229, 0)",
                      "0 0 0 4px rgba(79, 70, 229, 0.12)",
                      "0 0 0 0 rgba(79, 70, 229, 0)",
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: 3,
                    ease: "easeInOut",
                  }}
                  style={{ borderRadius: "0.375rem" }}
                >
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-pw"
                    type={showPassword ? "text" : "password"}
                    placeholder="En az 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </motion.div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pw">Şifre Tekrar</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-pw"
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifreyi tekrar girin"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive"
                >
                  Şifreler eşleşmiyor.
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Şifreyi Güncelle
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={clearPasswordReset}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                Şimdi değil, daha sonra güncelleyeceğim
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
