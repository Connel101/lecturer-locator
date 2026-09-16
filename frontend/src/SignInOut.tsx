import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "./lib/auth-client";

function SignInOut() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  

  const handleLogin = async () => {
    
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
    <section className="overflow-hidden rounded-[5px] border border-[#ece7ed] bg-white shadow-sm md:col-span-1 md:row-span-2">
      <div className="flex flex-col px-6 pb-6 pt-6">
        <h1 className="text-2xl font-bold text-[#261632]">Sign In</h1>
        <p className="mt-2 text-sm text-[#716777]">Sign in to manage lecturer information.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleLogin}>
          <label className="flex flex-col gap-2 text-sm font-semibold text-[#4d3a57]" htmlFor="email">
            Email
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-lg border border-[#d9cfde] px-4 py-3 font-normal text-[#261632] outline-none focus:border-[#8539b6] focus:ring-2 focus:ring-[#8539b6]/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#4d3a57]" htmlFor="password">
            Password
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-[#d9cfde] px-4 py-3 font-normal text-[#261632] outline-none focus:border-[#8539b6] focus:ring-2 focus:ring-[#8539b6]/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}

          <button onClick={handleLogin} disabled={isSigningIn} className="cursor-pointer mt-2 rounded-lg bg-[#3c1053] px-4 py-3 font-bold text-white transition hover:bg-[#54166f] disabled:cursor-wait disabled:opacity-60">
            {isSigningIn ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
       </section>
      </main>
  )
}

export default SignInOut