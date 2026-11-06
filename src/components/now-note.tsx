"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/data/portfolio";

type Note = { text: string; updatedAt: string };

const GIST_URL = `https://api.github.com/gists/${SITE.nowGistId}`;
const CACHE_KEY = "now-note";
const MAX_LENGTH = 280;
// GitHub refuses a blank Gist, so a lone "-" or "." is how to say "no note right now".
const NO_NOTE = /^[-.\s]*$/;

function readCache(): Note | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Note) : null;
  } catch {
    return null;
  }
}

function writeCache(note: Note | null) {
  try {
    if (note) localStorage.setItem(CACHE_KEY, JSON.stringify(note));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // Without storage the note still works, it just has no offline copy.
  }
}

function timeAgo(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!Number.isFinite(seconds)) return "";
  if (seconds < 60) return "just now";

  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const [unit, size] = units.find(([, length]) => seconds >= length) ?? units[units.length - 1];
  return `updated ${format.format(-Math.floor(seconds / size), unit)}`;
}

/**
 * A sticky note whose text lives in a public GitHub Gist, so it can change without a deploy.
 * If the fetch fails it keeps the last copy this browser saw; with no copy it renders nothing.
 * A Gist holding only dashes or dots hides the note, and so does deleting it. Both clear saved copies.
 */
export function NowNote() {
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setNote(readCache());

    fetch(GIST_URL, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`Gist request failed: ${response.status}`);
        return response.json();
      })
      .then((gist: { updated_at: string; files: Record<string, { content?: string }> } | null) => {
        const text = gist && Object.values(gist.files)[0]?.content?.trim().slice(0, MAX_LENGTH);
        const fresh = gist && text && !NO_NOTE.test(text) ? { text, updatedAt: gist.updated_at } : null;
        setNote(fresh);
        writeCache(fresh);
      })
      .catch(() => {
        // Keep whatever is already showing.
      });

    return () => controller.abort();
  }, []);

  if (!note) return null;

  return (
    <aside className="now-note" aria-label="What I'm doing right now">
      <p className="now-note-label">Right now</p>
      <p className="now-note-text">{note.text}</p>
      <p className="now-note-time">{timeAgo(note.updatedAt)}</p>
    </aside>
  );
}
