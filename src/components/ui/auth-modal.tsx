"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-6">
          <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h3 className="mb-2 text-2xl font-bold text-slate-900">Perlu Login</h3>
        <p className="mb-8 text-base text-slate-600">
          Anda diwajibkan login/register terlebih dahulu untuk membeli produk ini.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 flex-1"
          >
            Batal
          </button>
          <Link
            href="/login"
            className="rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white !text-white shadow-sm transition hover:bg-orange-600 flex-1"
          >
            Login / Register
          </Link>
        </div>
      </div>
    </div>
  );
}
