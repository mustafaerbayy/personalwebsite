import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import UpdatePasswordPage from "@/pages/UpdatePassword";

const Index = () => {
  const { user, loading, needsPasswordReset } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (needsPasswordReset) return <UpdatePasswordPage />;

  return <Dashboard />;
};

export default Index;
