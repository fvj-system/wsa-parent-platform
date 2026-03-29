import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-4 py-6"
      style={{
        backgroundColor: "#a49382",
        backgroundImage: "url('/background.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Login Card */}
      <section
        className="relative z-10 w-full max-w-md rounded-[32px] bg-[#f3ecdd]/95 shadow-2xl px-6 py-6 sm:px-7 sm:py-7"
        style={{
          backdropFilter: "blur(4px)",
        }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#5b735b]">
          Wild Stallion Academy
        </p>

        <div className="inline-flex rounded-full bg-[#5a3720] px-5 py-2 text-lg font-bold text-[#f6ead8] mt-2">
          Parent Portal
        </div>

        <h1 className="font-serif font-black leading-[0.9] text-[3.5rem] sm:text-[5rem] text-[#2f2417] mt-3">
          Wild Stallion
          <br />
          Academy
        </h1>

        <p className="mt-3 text-base text-[#4e4339]">
          Sign in to access your family dashboard, planner, badges, and tools.
        </p>

        <div className="mt-5">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
