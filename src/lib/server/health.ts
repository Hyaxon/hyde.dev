export function getHealth() {
  return {
    ok: true,
    service: "hyde.dev",
    timestamp: new Date().toISOString(),
  };
}
