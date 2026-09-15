function SignInOut() {
  return (
    <main className="page-shell">
      {/* Lecture's Details */}
    <section className="overflow-hidden rounded-[5px] border border-[#ece7ed] bg-white shadow-sm md:col-span-1 md:row-span-2">
      <div className="flex flex-col px-6 pb-6 pt-6">
        <h1 className="text-2xl font-bold text-[#261632]">Sign In</h1>
        <p className="mt-2 text-sm text-[#716777]">Sign in to manage lecturer information.</p>

        <form className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-[#4d3a57]" htmlFor="username">
            Username
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="rounded-lg border border-[#d9cfde] px-4 py-3 font-normal text-[#261632] outline-none focus:border-[#8539b6] focus:ring-2 focus:ring-[#8539b6]/20"
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
            />
          </label>

          <button type="submit" className="cursor-pointer mt-2 rounded-lg bg-[#3c1053] px-4 py-3 font-bold text-white transition hover:bg-[#54166f]">
            Sign in
          </button>
        </form>
      </div>
       </section>
      </main>
  )
}

export default SignInOut