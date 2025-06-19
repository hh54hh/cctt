import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth-new";

export default function Index() {
  return (
    <Navigate
      to={isAuthenticated() ? "/dashboard/subscribers" : "/login"}
      replace
    />
  );
}
