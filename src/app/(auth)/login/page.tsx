"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand/logo";
import {
  hasSupabaseEnv,
  missingSupabaseEnvMessage,
} from "@/lib/supabase/env";
import { getUserRole } from "@/lib/supabase/profile";
import { ArrowRight } from "lucide-react";

function mapAuthErrorMessage(message: string) {
  if (message === "Email not confirmed") {
    return "Email belum diverifikasi. Buka inbox email Anda lalu klik link verifikasi dari Supabase sebelum login.";
  }

  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const isSupabaseReady = hasSupabaseEnv();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const supabase = createClient();

    if (!supabase) {
      setErrorMessage(missingSupabaseEnvMessage);
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(mapAuthErrorMessage(error.message));
      setSubmitting(false);
      return;
    }

    const nextPath = new URLSearchParams(window.location.search).get("next");
    const role = data.user ? await getUserRole(supabase, data.user.id) : null;
    const fallbackPath = role === "admin" ? "/admin/dashboard" : "/";
    const redirectPath =
      nextPath && nextPath.startsWith("/") ? nextPath : fallbackPath;

    router.replace(redirectPath);
    router.refresh();
  };

  return (
    <div className="surface-panel w-full max-w-xl rounded-[2rem] p-6 text-slate-900 shadow-[0_25px_70px_rgba(83,54,20,0.12)] sm:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="kitchen-badge">Member login</div>
          <h1 className="font-display mt-5 text-5xl font-bold leading-none text-slate-900">
            Masuk ke kitchen pass.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
            Lanjutkan ke akun Anda untuk mengelola pesanan, menyimpan favorit,
            dan checkout lebih cepat.
          </p>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white shadow-lg">
          <BrandLogo
            size={50}
            className="h-12 w-12"
          />
        </div>
      </div>

      {!isSupabaseReady && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {missingSupabaseEnvMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Email
          </label>
          <input
            type="email"
            placeholder="Masukkan email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="kitchen-input"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Password
          </label>
          <input
            type="password"
            placeholder="Masukkan password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="kitchen-input"
          />
        </div>

        <button
          type="submit"
          disabled={!isSupabaseReady || submitting}
          className="kitchen-primary-btn mt-2 w-full px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Memproses..." : "Masuk ke Akun"}
          {!submitting && <ArrowRight className="h-4 w-4" strokeWidth={2.3} />}
        </button>
      </form>

      <div className="mt-6 rounded-[1.5rem] bg-[#f6ede2] px-4 py-4 text-sm text-slate-600">
        Akun akan dipakai untuk checkout lebih cepat, melihat keranjang Anda,
        dan mengakses dashboard admin bila role Anda adalah admin.
      </div>

      <p className="mt-6 text-center text-sm text-slate-700">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-orange-600">
          Daftar di sini
        </Link>
      </p>
    </div>
  );
}
