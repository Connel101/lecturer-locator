import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "./lib/auth-client";

function ProtectedRoute() {
      const {
    data: session,
    isPending,
    error,
  } = authClient.useSession();

  console.log("ProtectedRoute:", {
    isPending,
    error,
    session,
    user: session?.user,
  });

  if (isPending) {
    return (
      <main className="session-loader" role="status" aria-live="polite">
        <div className="session-loader__content">
          <span className="session-loader__wordmark" aria-hidden="true">NWU</span>
          <span className="session-loader__label">Loading your campus…</span>
        </div>
      </main>
    );
  }

  if (error) {
    console.error("Session error:", error);
    return <Navigate to="/signin" replace />;
  }

  if (!session?.user) {
    console.log("❌ No session - redirecting");
    return <Navigate to="/signin" replace />;
  }

  console.log("✅ Authenticated:", session.user.email);

  return <Outlet />;
}

export default ProtectedRoute;
