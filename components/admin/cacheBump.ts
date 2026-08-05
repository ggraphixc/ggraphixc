// Best-effort ISR purge after admin mutations. Makes edits appear on the
// public site instantly instead of waiting for the revalidate window.
export async function bumpContentCache() {
  try {
    await fetch("/api/revalidate", { cache: "no-store" });
  } catch {
    // ignore — pages refresh on their own revalidate interval
  }
}
