// Compresses values before they go into OBR room metadata, which is capped at 16kB total.
import { compressToUTF16, decompressFromUTF16 } from "lz-string";

const MARKER = "kob-lz1:";

export function encodeMetadataValue(value) {
  return MARKER + compressToUTF16(JSON.stringify(value));
}

// Falls back to returning uncompressed values as-is, so existing saved data keeps working.
export function decodeMetadataValue(raw) {
  if (raw == null) return raw;
  if (typeof raw !== "string") return raw;
  if (!raw.startsWith(MARKER)) return raw;

  try {
    const decompressed = decompressFromUTF16(raw.slice(MARKER.length));
    return JSON.parse(decompressed);
  } catch (err) {
    console.error("Failed to decode compressed metadata value:", err);
    return undefined;
  }
}

export function getMetadataValue(metadata, key) {
  return decodeMetadataValue(metadata?.[key]);
}
