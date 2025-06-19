import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";

const Login = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { authenticate } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const isValid = authenticate(code);

      if (isValid) {
        navigate("/");
      } else {
        setError("كود الدخول غير صحيح أو منتهي الصلاحية");
      }
    } catch (error) {
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gym-primary to-gym-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <Dumbbell className="w-10 h-10 text-gym-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">حسام جم</h1>
          <p className="text-white/80 text-lg">كمال الأجسام</p>
        </div>

        {/* Login card */}
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Lock className="w-5 h-5 text-gym-primary" />
              دخول النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-center">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="code"
                  className="text-sm font-medium text-gray-700"
                >
                  كود الدخول الشهري
                </label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="أدخل كود الدخول"
                  className="text-center text-lg font-mono tracking-wider"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gym-button text-lg py-6"
                disabled={isLoading || !code.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري التحقق...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>دخول النظام</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>

            {/* Demo info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 text-center">
                <strong>للتجربة:</strong> استخدم الكود{" "}
                <code className="bg-blue-100 px-2 py-1 rounded font-mono">
                  GYM2024
                </code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            نظام إدارة شامل للصالات الرياضية
          </p>
          <p className="text-white/40 text-xs mt-2">
            يعمل بدون إنترنت • تطبيق سطح مكتب
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
