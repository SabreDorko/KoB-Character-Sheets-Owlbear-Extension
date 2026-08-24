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

// OBR's own over-limit error is thrown host-side and isn't reliably catchable from
// the extension iframe, so we pre-check size against the cached metadata instead.
const ROOM_METADATA_BUDGET = 15000;

export function estimateMetadataBytes(metadataLike) {
  return new Blob([JSON.stringify(metadataLike)]).size;
}

export function wouldExceedRoomBudget(cachedMetadata, key, encodedValue) {
  const projected = { ...(cachedMetadata || {}), [key]: encodedValue };
  return estimateMetadataBytes(projected) > ROOM_METADATA_BUDGET;
}

