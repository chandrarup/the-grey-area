import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { localPreviewEnabled } from "@/lib/auth/policy";
import { LoginForm } from "./login-form";
import { enterLocalPreview } from "./actions";
export default async function LoginPage() {
  if (await getCurrentProfile()) redirect("/professor/simulations");
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      <section className="relative flex min-h-80 flex-col justify-between overflow-hidden bg-[#151e24] p-8 text-[#f1eee7] md:p-14 lg:p-20">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(120deg,transparent 35%,#c79a58 36%,transparent 37%),repeating-linear-gradient(90deg,transparent 0 110px,#78838a 111px 112px)",
          }}
        />
        <p className="relative font-mono text-[11px] uppercase tracking-[0.25em] text-[#d4b787]">
          Transformational Ethics Experience
        </p>
        <div className="relative max-w-lg py-16">
          <p className="mb-5 text-xs uppercase tracking-[0.2em] text-[#d4b787]">
            Executive simulations
          </p>
          <h1 className="font-serif text-5xl leading-[1.08] md:text-6xl">
            Decisions have
            <br />a life after
            <br />
            <em>the meeting.</em>
          </h1>
          <p className="mt-7 max-w-sm text-sm leading-7 text-white/60">
            Put people inside the pressure. Let them make the call, live with
            the consequences, and find their way back to their values.
          </p>
        </div>
        <p className="relative text-xs text-white/40">
          CaliBaja North American Leadership Academy
        </p>
      </section>
      <section className="flex items-center justify-center px-7 py-14 md:px-14">
        <div className="w-full max-w-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
            Instructor workspace
          </p>
          <h2 className="mt-4 font-serif text-4xl">Welcome back.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sign in to your simulations, groups, and participant insights.
          </p>
          <LoginForm />
          <div className="mt-9 border-t border-border pt-6">
            <p className="text-sm font-medium">Taking part in a simulation?</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Open the personal invitation link from your instructor. You do not
              need an account.
            </p>
          </div>
          {localPreviewEnabled() && (
            <form action={enterLocalPreview} className="mt-7">
              <button className="text-xs text-muted-foreground underline underline-offset-4">
                Open local instructor preview
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Development only · unavailable in production
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
