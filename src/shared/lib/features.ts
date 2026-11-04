/**
 * Feature flags para la interfaz de JabbuStore.
 *
 * En Next.js, las variables requeridas en el cliente (navegador) necesitan el prefijo NEXT_PUBLIC_.
 * Soportamos tanto `jabbumarquet` como `NEXT_PUBLIC_JABBUMARQUET` y `NEXT_PUBLIC_JABBU_MARKET`.
 */

const rawJabbuMarket =
  process.env.NEXT_PUBLIC_JABBUMARQUET ??
  process.env.NEXT_PUBLIC_jabbumarquet ??
  process.env.NEXT_PUBLIC_JABBU_MARKET ??
  process.env.NEXT_PUBLIC_ENABLE_JABBU_MARKET ??
  process.env.jabbumarquet;

export const isJabbuMarketEnabled = (): boolean => {
  if (
    rawJabbuMarket === "false" ||
    rawJabbuMarket === "0" ||
    rawJabbuMarket === "no" ||
    rawJabbuMarket === "off"
  ) {
    return false;
  }
  return true;
};

