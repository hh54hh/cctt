import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full gym-card">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">404</h2>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              الصفحة غير موجودة
            </h3>
            <p className="text-muted-foreground">
              عذراً، لا يمكن العثور على الصفحة التي تبحث عنها.
            </p>
          </div>
          <div className="space-y-3">
            <Link to="/subscribers">
              <Button className="w-full gym-button">
                <Home className="w-4 h-4 mr-2" />
                العودة للمشتركين
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
