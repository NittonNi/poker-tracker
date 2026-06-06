/** Esqueleto que aparece al instante mientras carga cada pantalla. */
export default function Loading() {
  return (
    <div className="animate-page space-y-4">
      <div className="h-7 w-44 animate-pulse rounded-lg bg-neutral-200" />
      <div className="h-4 w-60 animate-pulse rounded bg-neutral-200/70" />
      <div className="space-y-3 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-neutral-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
