export function RouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando"
      className="flex flex-col gap-4 animate-pulse"
    >
      <div className="h-8 w-64 rounded-lg bg-color-bg-subtle" />
      <div className="h-4 w-96 max-w-full rounded bg-color-bg-subtle" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div className="h-28 rounded-xl bg-color-bg-subtle" />
        <div className="h-28 rounded-xl bg-color-bg-subtle" />
        <div className="h-28 rounded-xl bg-color-bg-subtle" />
      </div>
      <div className="h-64 rounded-xl bg-color-bg-subtle" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
