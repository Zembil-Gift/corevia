"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LeadershipPrincipleResponse } from "@/lib/metrics-api";

const API = "/api/admin/metrics/peer-reviews/principles";
const OPEN_KEY = "principles-panel-open";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error((data as { error?: string }).error ?? "Request failed");
  return data;
}

interface PrinciplesManagerProps {
  principles: LeadershipPrincipleResponse[];
  /** The platform's 7 defaults; the "add defaults" button hides once the org has them all. */
  defaultPrinciples: LeadershipPrincipleResponse[];
  loading: boolean;
  onChanged: () => Promise<void> | void;
}

/** Per-organization CRUD for the principles employees rate each other against. */
export function PrinciplesManager({
  principles,
  defaultPrinciples,
  loading,
  onChanged,
}: PrinciplesManagerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // null = no saved preference: open only while the org has no principles yet.
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(OPEN_KEY);
      if (saved !== null) setOpen(saved === "true");
    } catch {
      // storage unavailable: fall back to the default
    }
  }, []);

  const expanded = open ?? (!loading && principles.length === 0);
  const toggleOpen = () => {
    const next = !expanded;
    setOpen(next);
    try {
      window.localStorage.setItem(OPEN_KEY, String(next));
    } catch {
      // best-effort preference only
    }
  };

  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await action();
      await onChanged();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const ok = await run("add", () =>
      send(API, "POST", {
        name: name.trim(),
        description: description.trim() || null,
        active: true,
      }),
    );
    if (ok) {
      setName("");
      setDescription("");
    }
  };

  const startEdit = (p: LeadershipPrincipleResponse) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDescription(p.description ?? "");
  };

  const saveEdit = async (p: LeadershipPrincipleResponse) => {
    if (!editName.trim()) return;
    const ok = await run(`edit-${p.id}`, () =>
      send(`${API}/${p.id}`, "PUT", {
        name: editName.trim(),
        description: editDescription.trim() || null,
        active: p.isActive,
      }),
    );
    if (ok) setEditingId(null);
  };

  const toggleActive = (p: LeadershipPrincipleResponse) =>
    run(`toggle-${p.id}`, () =>
      send(`${API}/${p.id}`, "PUT", {
        name: p.name,
        description: p.description,
        active: !p.isActive,
      }),
    );

  const remove = (p: LeadershipPrincipleResponse) => {
    if (
      !window.confirm(
        `Delete "${p.name}"? If it was already used in reviews it will be deactivated instead.`,
      )
    )
      return;
    return run(`delete-${p.id}`, () => send(`${API}/${p.id}`, "DELETE"));
  };

  const activeCount = principles.filter((p) => p.isActive).length;
  const existingNames = new Set(
    principles.map((p) => p.name.trim().toLowerCase()),
  );
  const missingDefaults = defaultPrinciples.filter(
    (d) => !existingNames.has(d.name.trim().toLowerCase()),
  ).length;

  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div
        className={`flex flex-wrap items-start justify-between gap-3 ${expanded ? "mb-4" : ""}`}
      >
        <div>
          <h2 className="text-lg font-semibold text-white">
            Rating principles
          </h2>
          <p className="text-sm text-zinc-400">
            Employees rate each other against your active principles (
            {activeCount} active).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!loading && missingDefaults > 0 && (
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              disabled={busy !== null}
              onClick={() =>
                run("defaults", () => send(`${API}/defaults`, "POST"))
              }
            >
              {busy === "defaults" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {missingDefaults === defaultPrinciples.length
                ? `Add the ${missingDefaults} default principles`
                : `Add the ${missingDefaults} missing default principle${missingDefaults === 1 ? "" : "s"}`}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="text-zinc-300 hover:text-white"
            aria-expanded={expanded}
            aria-controls="principles-panel"
            onClick={toggleOpen}
          >
            {expanded
              ? "Hide"
              : `Show ${principles.length > 0 ? `(${principles.length})` : ""}`}
            <ChevronDown
              className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div id="principles-panel" hidden={!expanded}>
        {error && (
          <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="size-4 animate-spin" /> Loading principles...
          </p>
        ) : principles.length === 0 ? (
          <p className="mb-4 text-sm text-zinc-500">
            No principles yet. Add your own below or use the 7 defaults.
          </p>
        ) : (
          <ul className="mb-4 divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {principles.map((p) =>
              editingId === p.id ? (
                <li key={p.id} className="space-y-2 p-3">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="Principle name"
                  />
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optional)"
                    aria-label="Principle description"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                      disabled={busy !== null}
                      onClick={() => saveEdit(p)}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </li>
              ) : (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${p.isActive ? "text-white" : "text-zinc-500 line-through"}`}
                    >
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="text-xs text-zinc-400">{p.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-zinc-300"
                      disabled={busy !== null}
                      onClick={() => toggleActive(p)}
                    >
                      {p.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Edit ${p.name}`}
                      disabled={busy !== null}
                      onClick={() => startEdit(p)}
                    >
                      <Pencil className="size-4 text-zinc-300" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${p.name}`}
                      disabled={busy !== null}
                      onClick={() => remove(p)}
                    >
                      <Trash2 className="size-4 text-red-400" />
                    </Button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        <form
          onSubmit={handleAdd}
          className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="principle-name" className="text-zinc-300">
              New principle
            </Label>
            <Input
              id="principle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer Obsession"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="principle-description" className="text-zinc-300">
              Description
            </Label>
            <Input
              id="principle-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this looks like in practice (optional)"
            />
          </div>
          <Button
            type="submit"
            className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
            disabled={busy !== null || !name.trim()}
          >
            {busy === "add" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add
          </Button>
        </form>
      </div>
    </section>
  );
}
