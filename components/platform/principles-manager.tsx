"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LeadershipPrincipleResponse } from "@/lib/metrics-api";

const API = "/api/platform/principles";

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
  loading: boolean;
  onChanged: () => Promise<void> | void;
}

/** Platform-admin CRUD for the principles every organization's employees rate each other against. */
export function PrinciplesManager({
  principles,
  loading,
  onChanged,
}: PrinciplesManagerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<LeadershipPrincipleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const p = pendingDelete;
    setPendingDelete(null);
    await run(`delete-${p.id}`, () => send(`${API}/${p.id}`, "DELETE"));
  };

  const activeCount = principles.filter((p) => p.isActive).length;

  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Rating principles</h2>
        <p className="text-sm text-zinc-400">
          Shared by every organization; employees rate each other against the
          active ones ({activeCount} active).
        </p>
      </div>

      <div>
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
            No principles yet. Add the first one below.
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
                      className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
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
                      onClick={() => setPendingDelete(p)}
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
            className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
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

      <AlertDialog.Root
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <AlertDialog.Title className="text-lg font-semibold text-white">
              Delete principle
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-zinc-400">
              Delete &ldquo;{pendingDelete?.name}&rdquo;? If it was already
              used in reviews it will be deactivated instead.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="ghost" className="text-zinc-300">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  className="bg-red-500 text-white hover:bg-red-400"
                  onClick={confirmDelete}
                >
                  Delete
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  );
}
