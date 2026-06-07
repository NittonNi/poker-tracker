"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/components/ui";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-overlay absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Móvil: hoja a pantalla completa. Escritorio: tarjeta centrada. */}
      <div className="animate-in relative z-10 flex h-dvh w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:max-w-md sm:rounded-3xl sm:border sm:border-neutral-200">
        <div className="safe-top flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="safe-bottom min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Botón que abre un modal cuyo contenido recibe una función `close`. */
export function ModalButton({
  label,
  title,
  className,
  children,
}: {
  label: React.ReactNode;
  title: string;
  className?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={cn(className)} onClick={() => setOpen(true)}>
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        {children(() => setOpen(false))}
      </Modal>
    </>
  );
}
