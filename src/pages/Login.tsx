import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dumbbell, Lock } from "lucide-react";
import { login } from "@/lib/auth";

const ACCESS_CODE = "112233";

export default function Login() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (code === ACCESS_CODE) {
      await login();
      navigate("/dashboard");
    } else {
      setError("رمز الدخول غير صحيح");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div
        className={
          'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f97316" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] opacity-50'
        }
      ></div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-lg">
              <Dumbbell className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            صالة حسام
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            لكمال الأجسام والرشاقة
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="access-code"
                className="text-right block text-gray-700 font-medium"
              >
                رمز الدخول
              </Label>
              <div className="relative">
                <Input
                  id="access-code"
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="أدخل رمز الدخول"
                  className="text-center text-2xl font-mono tracking-widest h-14 border-2 border-gray-200 focus:border-orange-400 focus:ring-orange-400 bg-white/90"
                  maxLength={6}
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 text-center">
                أدخل الرمز المكون من 6 أرقام
              </p>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-right">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? "جاري التحقق..." : "دخول"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              مرحباً بك في نظام إدارة صالة حسام
            </p>
            <div className="flex justify-center items-center gap-2 mt-2 text-xs text-gray-400">
              <span>نظام ذكي ومتطور</span>
              <Dumbbell className="h-3 w-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
