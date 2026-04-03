import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { prisma } from "@/lib/prisma";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/gallery");
  }

  const hasUsers = (await prisma.user.count()) > 0;

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        {hasUsers ? (
          <div className="glass-card animate-fade-in-up rounded-[32px] p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-[var(--gold)] opacity-20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-[var(--forest)] opacity-20 blur-3xl pointer-events-none" />
            
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)] relative z-10">Accounts Closed</p>
            <h1 className="mt-4 font-serif text-[2.2rem] font-semibold text-gradient relative z-10 leading-10">The main admin creates new accounts</h1>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)] relative z-10">
              Public registration is turned off for this space. Ask the main admin to create your login, then sign in and update your password from the profile page.
            </p>
            
            <Link 
              href="/login" 
              className="mt-8 inline-block w-full rounded-full bg-gradient-to-r from-[var(--forest)] to-[#18362d] px-4 py-4 font-medium text-white shadow-[0_12px_24px_rgba(30,69,58,0.3)] transition-all hover:shadow-[0_16px_32px_rgba(30,69,58,0.4)] hover:-translate-y-0.5 active:scale-[0.98] relative z-10"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <RegisterForm />
        )}
      </div>
    </main>
  );
}
