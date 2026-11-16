// Room metadata helpers for the Kids on Bikes extension.
//
// OBR room metadata is capped at ~16 kB TOTAL, shared by every extension in the room.
// This module keeps our footprint small and well-behaved:
//   * values are compressed (base64 flavour: the cap is measured in bytes, and UTF-16
//     "compressed" strings cost 3 bytes per character once serialised as UTF-8 JSON)
//   * we never delete other people's players' sheets automatically; the GM prunes manually
//   * we refuse writes that would grow the room past a safety budget, instead of letting
//     OBR's host-side error swallow them
//   * our own keys are held to a separate, smaller budget so other extensions keep headroom
import {
  compressToBase64,
  decompressFromBase64,
  decompressFromUTF16,
} from "lz-string";

const MARKER = "kob-lz2:";               // current: base64
const LEGACY_UTF16_MARKER = "kob-lz1:";  // previous version: UTF-16 (still readable)

export const KEY_PREFIX = "kob-";
export const SHEET_KEY_PREFIX = "kob-sheet-";
export const ROOM_INSTANCE_KEY = "kob-room-instance";
export const POWERED_KEY = "kob-powered-sheet";
export const GM_NOTES_KEY = "kob-gm-notes";

// Display only. OBR documents the cap as 16 kB; we assume the smaller reading.
export const ROOM_METADATA_LIMIT = 16000;
// Hard safety budget for the whole room (all extensions combined).
export const ROOM_METADATA_BUDGET = 15000;
// Budget for keys that start with "kob-". Leaves the rest of the room for other extensions.
export const OWN_METADATA_BUDGET = 10000;

const FALLBACK_ROOM_INSTANCE = "default-room";
const KNOWN_KEYS = new Set([ROOM_INSTANCE_KEY, POWERED_KEY, GM_NOTES_KEY]);

// ─── Encoding ─────────────────────────────────────────────────────

export function encodeMetadataValue(value) {
  return MARKER + compressToBase64(JSON.stringify(value));
}

// Plain (uncompressed) values from older versions are returned as-is so saved data keeps working.
export function decodeMetadataValue(raw) {
  if (raw == null) return raw;
  if (typeof raw !== "string") return raw;

  const isCurrent = raw.startsWith(MARKER);
  const isLegacy = raw.startsWith(LEGACY_UTF16_MARKER);
  if (!isCurrent && !isLegacy) return raw;

  try {
    // lz-string returns null/"" (rather than throwing) for corrupt input.
    const text = isCurrent
      ? decompressFromBase64(raw.slice(MARKER.length))
      : decompressFromUTF16(raw.slice(LEGACY_UTF16_MARKER.length));
    if (!text) throw new Error("empty or corrupt payload");
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to decode compressed metadata value:", err);
    return undefined;
  }
}

export function getMetadataValue(metadata, key) {
  return decodeMetadataValue(metadata?.[key]);
}

// ─── Size accounting ──────────────────────────────────────────────

const encoder = new TextEncoder();
const byteLength = str => encoder.encode(str).length;

function entryBytes(key, value) {
  const json = JSON.stringify(value);
  return byteLength(JSON.stringify(key)) + byteLength(json === undefined ? "null" : json) + 2;
}

export function measureMetadata(metadata) {
  let total = 2;
  let own = 0;
  Object.entries(metadata || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    const bytes = entryBytes(key, value);
    total += bytes;
    if (key.startsWith(KEY_PREFIX)) own += bytes;
  });
  return { total, own, others: total - own };
}

// Applies a patch the way OBR does: null/undefined removes the key.
export function projectMetadata(cachedMetadata, metadataPatch) {
  const projected = { ...(cachedMetadata || {}) };
  Object.entries(metadataPatch || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      delete projected[key];
      return;
    }
    projected[key] = value;
  });
  return projected;
}

// A write is only refused if it GROWS usage past a budget. Writes that shrink the room are
// always allowed, so a full room can still be cleaned up (and a shrinking sheet still saves).
export function checkRoomBudget(cachedMetadata, keyOrPatch, encodedValue) {
  const patch = typeof keyOrPatch === "string"
    ? { [keyOrPatch]: encodedValue }
    : (keyOrPatch || {});
  const before = measureMetadata(cachedMetadata);
  const after = measureMetadata(projectMetadata(cachedMetadata, patch));

  if (after.total > before.total && after.total > ROOM_METADATA_BUDGET) {
    return { ok: false, reason: "room" };
  }
  if (after.own > before.own && after.own > OWN_METADATA_BUDGET) {
    return { ok: false, reason: "own" };
  }
  return { ok: true, reason: null };
}

export function wouldExceedRoomBudget(cachedMetadata, keyOrPatch, encodedValue) {
  return !checkRoomBudget(cachedMetadata, keyOrPatch, encodedValue).ok;
}

// ─── Sheets ───────────────────────────────────────────────────────

export function buildSheetMetadataKey(playerId) {
  return `${SHEET_KEY_PREFIX}${playerId}`;
}

// Every stored sheet, whether or not that player is connected.
export function listSheetEntries(metadata) {
  return Object.keys(metadata || {})
    .filter(key => key.startsWith(SHEET_KEY_PREFIX))
    .map(key => {
      const decoded = getMetadataValue(metadata, key);
      return {
        key,
        playerId: key.slice(SHEET_KEY_PREFIX.length),
        data: decoded && typeof decoded === "object" ? decoded : undefined,
        bytes: entryBytes(key, metadata[key]),
      };
    });
}

// Cheap fingerprint used to decide whether the party view actually needs to re-render.
export function partyViewSignature(metadata, { excludePlayerId = "", includeUsage = false } = {}) {
  const m = metadata || {};
  const skip = excludePlayerId ? buildSheetMetadataKey(excludePlayerId) : null;
  const parts = Object.keys(m)
    .filter(key => key.startsWith(SHEET_KEY_PREFIX) && key !== skip)
    .sort()
    .map(key => `${key}=${typeof m[key] === "string" ? m[key] : JSON.stringify(m[key])}`);
  const usage = includeUsage ? `#${measureMetadata(m).total}` : "";
  return parts.join("|") + usage;
}

// ─── Cleanup (GM-triggered only) ──────────────────────────────────

// OBR removes a key when it is set to undefined.
export function buildRemovePatch(keys) {
  const patch = {};
  (keys || []).forEach(key => { patch[key] = undefined; });
  return patch;
}

// Keys from older versions of this extension that nothing reads any more.
export function findLegacyKeys(metadata) {
  return Object.keys(metadata || {})
    .filter(key => key.startsWith(KEY_PREFIX)
      && !key.startsWith(SHEET_KEY_PREFIX)
      && !KNOWN_KEYS.has(key))
    .map(key => ({ key, bytes: entryBytes(key, metadata[key]) }));
}

// ─── Room instance id ─────────────────────────────────────────────
// Scopes localStorage backups to a room. If the id can't be stored we use a fixed fallback
// rather than a random one, so local backups stay findable on the next load.

export function createRoomInstanceId() {
  return `r-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function resolveRoomInstanceId(OBR, metadata) {
  const existing = getMetadataValue(metadata, ROOM_INSTANCE_KEY);
  if (typeof existing === "string" && existing) return existing;

  const generated = createRoomInstanceId();
  const patch = { [ROOM_INSTANCE_KEY]: generated };
  if (wouldExceedRoomBudget(metadata, patch)) return FALLBACK_ROOM_INSTANCE;

  try {
    await OBR.room.setMetadata(patch);
    // Two clients can race to create the id; re-read so everyone agrees on the winner.
    const fresh = await OBR.room.getMetadata();
    const winner = getMetadataValue(fresh, ROOM_INSTANCE_KEY);
    return typeof winner === "string" && winner ? winner : generated;
  } catch {
    return FALLBACK_ROOM_INSTANCE;
  }
}