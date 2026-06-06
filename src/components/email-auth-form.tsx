"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, inputClass, labelClass } from "@/components/ui";

type Mode = "signin" | "signup";

export function EmailAuthForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const destination = next || "/grupos";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setLoading(false);
        setError("Email o contraseña incorrectos.");
        return;
      }
      window.location.href = destination;
      return;
    }

    // signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          destination,
        )}`,
      },
    });
    if (error) {
      setLoading(false);
      setError(
        error.message.includes("at least")
          ? "La contraseña debe tener al menos 6 caracteres."
          : "No se pudo crear la cuenta. ¿Quizá ya existe ese email?",
      );
      return;
    }
    if (data.session) {
      // Sin confirmación de email: ya tiene sesión.
      window.location.href = destination;
      return;
    }
    // Con confirmación de email activada.
    setLoading(false);
    setInfo(
      "Te hemos enviado un correo para confirmar tu cuenta. Ábrelo y pulsa el enlace.",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="tucorreo@ejemplo.com"
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`${buttonClass("primary", "lg")} w-full`}
      >
        {loading
          ? "Un momento…"
          : mode === "signin"
            ? "Iniciar sesión"
            : "Crear cuenta"}
      </button>

      <p className="pt-1 text-center text-sm text-neutral-500">
        {mode === "signin" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
          className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
        >
          {mode === "signin" ? "Crea una" : "Inicia sesión"}
        </button>
      </p>
    </form>
  );
}
