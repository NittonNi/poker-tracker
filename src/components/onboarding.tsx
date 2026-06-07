"use client";

import { useEffect, useState } from "react";
import {
  Spade,
  HandCoins,
  Trophy,
  Share,
  SquarePlus,
  Download,
  ChevronRight,
  MessageSquarePlus,
} from "lucide-react";
import { buttonClass } from "@/components/ui";

const STORAGE_KEY = "pht_onboarded_v1";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function Onboarding() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      setShow(true);
    }
    const ua = navigator.userAgent || "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    setIsIOS(ios);
    if (standalone) {
      // Ya instalada: no molestar.
      setShow(false);
    }

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (!mounted || !show) return null;

  const slides: {
    icon: React.ReactNode;
    title: string;
    text: string;
    badge?: string;
    install?: boolean;
  }[] = [
    {
      icon: <Spade size={40} />,
      title: "Bienvenido a Poker Home Tracker",
      text: "Lleva las cuentas de vuestras partidas caseras de poker, sin discusiones ni servilletas.",
      badge: "Versión de prueba (beta)",
    },
    {
      icon: <HandCoins size={40} />,
      title: "Quién paga a quién",
      text: "Apunta los buy-ins y recompras durante la partida. Al cerrarla, la app calcula sola la liquidación: quién cobra y quién paga.",
    },
    {
      icon: <Trophy size={40} />,
      title: "Pique sano",
      text: "Ranking del grupo, estadísticas y un resumen de cada noche que podéis compartir como una imagen.",
    },
    {
      icon: <MessageSquarePlus size={40} />,
      title: "Es una beta: ayúdanos",
      text: "La app está en pruebas y mejora con vuestras ideas. ¿Algo que falla o que echas en falta? Mándanos feedback desde el menú de tu perfil (arriba a la derecha) → “Enviar feedback”.",
    },
    {
      icon: <Download size={40} />,
      title: "Instálala como una app",
      text: "Tenla en tu móvil como una aplicación más, a un toque.",
      install: true,
    },
  ];

  const last = i === slides.length - 1;
  const s = slides[i];

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-white to-neutral-100 px-6 py-8">
      {/* Saltar */}
      <div className="flex justify-end">
        <button
          onClick={finish}
          className="text-sm font-medium text-neutral-400 transition-colors hover:text-neutral-700"
        >
          Saltar
        </button>
      </div>

      {/* Contenido */}
      <div
        key={i}
        className="animate-page flex flex-1 flex-col items-center justify-center text-center"
      >
        <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-neutral-900 text-white shadow-xl ring-1 ring-black/5">
          {s.icon}
        </div>
        {s.badge && (
          <span className="mb-3 inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
            {s.badge}
          </span>
        )}
        <h1 className="max-w-xs text-2xl font-bold tracking-tight text-neutral-900">
          {s.title}
        </h1>
        <p className="mt-3 max-w-xs text-balance text-neutral-500">{s.text}</p>

        {s.install && (
          <div className="mt-6 w-full max-w-xs">
            {deferred ? (
              <button
                onClick={install}
                className={`${buttonClass("primary")} w-full`}
              >
                <Download size={16} />
                Instalar app
              </button>
            ) : isIOS ? (
              <div className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-4 text-left text-sm text-neutral-600">
                <Step n={1}>
                  Toca <Share size={15} className="inline align-text-bottom" />{" "}
                  <b>Compartir</b> en la barra de Safari.
                </Step>
                <Step n={2}>
                  Elige{" "}
                  <SquarePlus size={15} className="inline align-text-bottom" />{" "}
                  <b>Añadir a pantalla de inicio</b>.
                </Step>
                <Step n={3}>¡Listo! Ábrela desde el icono nuevo.</Step>
              </div>
            ) : (
              <div className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-4 text-left text-sm text-neutral-600">
                <Step n={1}>
                  Abre el <b>menú del navegador</b> (⋮ arriba a la derecha).
                </Step>
                <Step n={2}>
                  Toca <b>Instalar app</b> o <b>Añadir a pantalla de inicio</b>.
                </Step>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Puntos */}
      <div className="mb-5 flex justify-center gap-2">
        {slides.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-6 bg-neutral-900" : "w-2 bg-neutral-300"
            }`}
          />
        ))}
      </div>

      {/* Acción */}
      <button
        onClick={() => (last ? finish() : setI((v) => v + 1))}
        className={`${buttonClass("primary", "lg")} w-full`}
      >
        {last ? "Empezar" : "Siguiente"}
        {!last && <ChevronRight size={18} />}
      </button>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-bold text-white">
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}
