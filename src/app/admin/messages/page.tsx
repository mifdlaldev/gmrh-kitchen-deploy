"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  hasSupabaseEnv,
  missingSupabaseEnvMessage,
} from "@/lib/supabase/env";
import { mapContactMessagesErrorMessage } from "@/lib/supabase/contact-messages";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export default function AdminMessagesPage() {
  const isSupabaseReady = hasSupabaseEnv();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadMessages = async () => {
      const supabase = createClient();

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(mapContactMessagesErrorMessage(error.message));
        setLoading(false);
        return;
      }

      setMessages(data || []);
      setLoading(false);
    };

    loadMessages();
  }, []);

  return (
    <section className="space-y-8 text-gray-900">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
          Inbox
        </p>
        <h1 className="font-display mt-2 text-4xl font-bold text-gray-900">
          Pesan Masuk
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
          Semua pesan dari halaman contact akan tampil di sini, dengan tampilan yang lebih nyaman dibaca oleh admin.
        </p>
      </div>

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

      <div className="grid gap-5">
        {loading && (
          <div className="surface-panel rounded-[2rem] p-6 text-sm text-gray-500">
            Memuat pesan...
          </div>
        )}

        {!loading && !errorMessage && messages.length === 0 && (
          <div className="surface-panel rounded-[2rem] p-6 text-sm text-gray-500">
            Belum ada pesan masuk.
          </div>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className="surface-panel rounded-[2rem] p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                  Dari pelanggan
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                  {message.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-orange-600">{message.email}</p>
              </div>

              <p className="text-xs text-gray-400">
                {new Date(message.created_at).toLocaleString("id-ID")}
              </p>
            </div>

            <p className="mt-5 whitespace-pre-line rounded-[1.4rem] bg-white/80 p-5 text-sm leading-7 text-gray-600">
              {message.message}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
