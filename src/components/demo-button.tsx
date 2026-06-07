"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { createDemoGroup } from "@/app/actions/demo";

export function DemoButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    start(async () => {
      const res = await createDemoGroup();
      if (res.ok) router.push(`/grupos/${res.groupId}`);
      else setError(res.error);
    });
  }

  return (
    <>
      <button
        onClick={go}
        disabled={pending}
        className={`${buttonClass("secondary")} w-full`}
      >
        <Wand2 size={16} />
        {pending ? "Creando ejemplo…" : "Probar con un grupo de ejemplo"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </>
  );
}
