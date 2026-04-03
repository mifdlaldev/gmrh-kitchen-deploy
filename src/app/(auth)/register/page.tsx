"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand/logo";
import { hasSupabaseEnv, missingSupabaseEnvMessage } from "@/lib/supabase/env";

export default function RegisterPage() {
  const router = useRouter();
  const isSupabaseReady = hasSupabaseEnv();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const supabase = createClient();

    if (!supabase) {
      setErrorMessage(missingSupabaseEnvMessage);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi password harus sama.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          role: "customer",
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    setSuccessMessage(
      data.session
        ? "Akun berhasil dibuat. Anda sedang diarahkan ke halaman utama."
        : "Akun berhasil dibuat. Silakan cek email Anda untuk verifikasi akun.",
    );

    if (!data.session) {
      const params = new URLSearchParams({
        email,
        message: "check-email",
      });

      router.replace(`/login?${params.toString()}`);
      router.refresh();
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <div className="surface-panel w-full max-w-2xl rounded-[2rem] p-6 text-slate-900 shadow-[0_25px_70px_rgba(83,54,20,0.12)] sm:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="kitchen-badge">Create account</div>
          <h1 className="font-display mt-5 text-5xl font-bold leading-none text-slate-900">
            Buka akses ke kitchen Anda.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
            Daftar untuk menyimpan data pelanggan, mempercepat checkout, dan
            menikmati pengalaman pesan yang lebih rapi di setiap kunjungan.
          </p>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white shadow-lg">
          <BrandLogo size={50} className="h-12 w-12" />
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

      {successMessage && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleRegister} className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Nama Lengkap
          </label>
          <input
            type="text"
            placeholder="Masukkan nama lengkap"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="kitchen-input"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Nomor Telepon
          </label>
          <input
            type="tel"
            placeholder="Masukkan nomor telepon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="kitchen-input"
          />
        </div>

        <div className="md:col-span-2">
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

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Konfirmasi Password
          </label>
          <input
            type="password"
            placeholder="Ulangi password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="kitchen-input"
          />
        </div>

        <button
          type="submit"
          disabled={!isSupabaseReady || submitting}
          className="kitchen-primary-btn mt-2 w-full px-6 py-4 text-base font-semibold md:col-span-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Memproses..." : "Buat Akun Baru"}
        </button>
      </form>

      <div className="mt-6 rounded-[1.5rem] bg-[#f6ede2] px-4 py-4 text-sm text-slate-600">
        Setelah akun dibuat, Anda bisa langsung masuk dan melanjutkan pengalaman
        pesan makanan dengan data yang sudah tersimpan.
      </div>

      <p className="mt-6 text-center text-sm text-slate-700">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-orange-600">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
