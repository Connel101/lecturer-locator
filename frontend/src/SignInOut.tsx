import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "./lib/auth-client";

function SignInOut() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSigningIn(true);

    try {
      const { error } = await authClient.signIn.email({ email, password });

      if (error) {
        setErrorMessage(error.message || "The email or password is incorrect.");
        return;
      }

      navigate("/lecturers");
    } catch {
      setErrorMessage("Unable to reach the sign-in service. Make sure the backend is running.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <main className="page-shell">
      {/* Lecture's Details */}
    <section className="overflow-hidden rounded-[5px] border border-[color:var(--theme-border)] bg-[var(--theme-surface)] shadow-sm md:col-span-1 md:row-span-2">
      <div className="flex flex-col px-6 pb-6 pt-6">
        <h1 className="text-2xl font-bold text-[color:var(--theme-text)]">Sign In</h1>
        <p className="mt-2 text-sm text-[color:var(--theme-muted)]">Sign in to manage lecturer information.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleLogin}>
          <label className="flex flex-col gap-2 text-sm font-semibold text-[color:var(--theme-secondary)]" htmlFor="email">
            Email
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="theme-input rounded-lg border border-[color:var(--theme-border)] px-4 py-3 font-normal text-[color:var(--theme-text)] outline-none focus:border-[color:var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[color:var(--theme-secondary)]" htmlFor="password">
            Password
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="theme-input rounded-lg border border-[color:var(--theme-border)] px-4 py-3 font-normal text-[color:var(--theme-text)] outline-none focus:border-[color:var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {errorMessage && <p role="alert" className="text-sm text-[color:var(--theme-danger)]">{errorMessage}</p>}

          <button type="submit" disabled={isSigningIn} className="cursor-pointer mt-2 rounded-lg bg-[var(--theme-button)] px-4 py-3 font-bold text-white transition hover:bg-[var(--theme-button-hover)] disabled:cursor-wait disabled:opacity-60">
            {isSigningIn ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
       </section>
      </main>
  )
}

export default SignInOut