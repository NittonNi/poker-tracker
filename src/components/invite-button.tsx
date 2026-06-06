"use client";

import { useState, useTransition } from "react";
import { UserPlus, Copy, Check, Share2, RefreshCw } from "lucide-react";
import { ModalButton } from "@/components/dialog";
import { buttonClass } from "@/components/ui";
import { regenerateInviteCode } from "@/app/actions/groups";

export function InviteButton({
  groupId,
  inviteCode,
}: {
  groupId: string;
  inviteCode: string;
}) {
  return (
    <ModalButton
      label={
        <>
          <UserPlus size={16} />
          Invitar
        </>
      }
      title="Invitar al grupo"
      className={buttonClass("secondary", "sm")}
    >
      {() => <InvitePanel groupId={groupId} inviteCode={inviteCode} />}
    </ModalButton>
  );
}

function InvitePanel({
  groupId,
  inviteCode,
}: {
  groupId: string;
  inviteCode: string;
}) {
  const [code, setCode] = useState(inviteCode);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmNew, setConfirmNew] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/unirse/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Si falla el portapapeles, al menos seleccionamos el texto.
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Únete a mi grupo de poker",
          text: "Únete a nuestro grupo para llevar las partidas:",
          url: link,
        });
      } catch {
        /* cancelado */
      }
    } else {
      copy();
    }
  }

  function regenerate() {
    startTransition(async () => {
      const res = await regenerateInviteCode(groupId);
      if (res.ok) {
        setCode(res.code);
        setConfirmNew(false);
        setCopied(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Comparte este enlace. Quien lo abra con su cuenta entrará al grupo y
        podrá ver las partidas y su balance.
      </p>

      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">
          {link}
        </span>
        <button
          onClick={copy}
          className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-neutral-900 px-2.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      <button onClick={share} className={`${buttonClass("primary")} w-full`}>
        <Share2 size={16} />
        Compartir enlace
      </button>

      <div className="border-t border-neutral-200 pt-4">
        {!confirmNew ? (
          <button
            onClick={() => setConfirmNew(true)}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <RefreshCw size={14} />
            Generar enlace nuevo
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-600">
              El enlace anterior dejará de funcionar. ¿Seguro?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmNew(false)}
                className={`${buttonClass("secondary", "sm")} flex-1`}
              >
                No
              </button>
              <button
                onClick={regenerate}
                disabled={pending}
                className={`${buttonClass("primary", "sm")} flex-1`}
              >
                {pending ? "Generando…" : "Sí, generar nuevo"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
