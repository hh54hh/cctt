import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (password === "112233") {
      toast.success("تم تسجيل الدخول بنجاح");
      navigate("/subscribers");
    } else {
      toast.error("رمز الدخول غير صحيح");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            صالة حسام جم
          </h1>
          <p className="text-muted-foreground">نظام إدارة الصالة الرياضية</p>
        </div>

        {/* Login form */}
        <Card className="gym-card">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold">تسجيل الدخول</h2>
            <p className="text-sm text-muted-foreground">
              أدخل رمز الدخول للوصول إلى النظام
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-right block">
                  رمز الدخول
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل رمز الدخول"
                    className="pr-12 text-right"
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gym-button"
                disabled={isLoading}
              >
                {isLoading ? "جارٍ تسجيل الدخول..." : "دخول"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                رمز الدخول الافتراضي: <strong>112233</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          © 2024 صالة حسام جم - جميع الحقوق محفوظة
        </div>
      </div>
    </div>
  );
}
