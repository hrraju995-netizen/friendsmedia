import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/gallery");
  }

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <SignInForm />
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Need an account? Ask the main admin to create it for you.
        </p>
      </div>
    </main>
  );
}
