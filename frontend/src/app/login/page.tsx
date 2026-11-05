
import { Suspense } from "react";
import AuthGate from "@/components/auth-gate";
import WorkspaceClient from "../workspace-client";

type LoginPageProps = {
  searchParams: Promise<{
    mode?: string;
  }>;
};

async function LoginPageContent({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialMode = params.mode === "signup" ? "signup" : "login";

  return (
    <AuthGate initialMode={initialMode}>
      <WorkspaceClient />
    </AuthGate>
  );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="min-h-screen">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            Loading...
          </div>
        }
      >
        <LoginPageContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
