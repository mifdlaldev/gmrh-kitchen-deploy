"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  hasSupabaseEnv,
  missingSupabaseEnvMessage,
} from "@/lib/supabase/env";
import { mapContactMessagesErrorMessage } from "@/lib/supabase/contact-messages";

export function ContactForm() {
  const isSupabaseReady = hasSupabaseEnv();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const supabase = createClient();

    if (!supabase) {
      setErrorMessage(missingSupabaseEnvMessage);
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      message,
    });

    if (error) {
      setErrorMessage(mapContactMessagesErrorMessage(error.message));
      setSubmitting(false);
      return;
    }

    setName("");
    setEmail("");
    setMessage("");
    setSubmitting(false);
    setSuccessMessage("Pesan Anda berhasil dikirim. Admin akan segera melihatnya.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isSupabaseReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {missingSupabaseEnvMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-900">
          Nama
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masukkan nama Anda"
          required
          className="kitchen-input"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-900">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Masukkan email Anda"
          required
          className="kitchen-input"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-900">
          Pesan
        </label>
        <textarea
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tulis pesan Anda..."
          required
          className="kitchen-input resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!isSupabaseReady || submitting}
        className="kitchen-primary-btn w-full px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Mengirim..." : "Kirim Pesan"}
      </button>
    </form>
  );
}
