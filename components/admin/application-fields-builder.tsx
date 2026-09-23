"use client"

import { ArrowDown, ArrowUp, FileText, Link2, Plus, Trash2, Type } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  APPLICATION_FILE_TYPES,
  DEFAULT_TEXT_ANSWER_LENGTH,
  MAX_APPLICATION_FIELDS,
  MAX_TEXT_ANSWER_LENGTH,
  type ApplicationField,
  type ApplicationFieldType,
  type ApplicationFileType,
} from "@/lib/jobs-api"

const TYPE_META: Record<ApplicationFieldType, { label: string; icon: typeof Link2; placeholder: string }> = {
  LINK: { label: "Link", icon: Link2, placeholder: "e.g. Portfolio, LinkedIn profile" },
  FILE: { label: "File upload", icon: FileText, placeholder: "e.g. Cover letter, Writing sample" },
  TEXT: { label: "Written answer", icon: Type, placeholder: "e.g. Why do you want to join us?" },
}

const FILE_TYPE_KEYS = Object.keys(APPLICATION_FILE_TYPES) as ApplicationFileType[]

function newField(type: ApplicationFieldType): ApplicationField {
  return {
    id: `f-${Math.random().toString(36).slice(2, 10)}`,
    type,
    label: "",
    helpText: "",
    required: true,
    fileTypes: type === "FILE" ? ["PDF", "DOCX"] : null,
    maxLength: type === "TEXT" ? DEFAULT_TEXT_ANSWER_LENGTH : null,
  }
}

/** Returns an error message if the form definition can't be saved, else null. */
export function validateApplicationFields(fields: ApplicationField[]): string | null {
  for (const [i, f] of fields.entries()) {
    const name = `Application field ${i + 1}`
    if (!f.label.trim()) return `${name} needs a title.`
    if (f.type === "FILE" && !f.fileTypes?.length) return `"${f.label}" needs at least one allowed file type.`
    if (f.type === "TEXT") {
      const max = f.maxLength ?? 0
      if (!Number.isInteger(max) || max < 1 || max > MAX_TEXT_ANSWER_LENGTH) {
        return `"${f.label}" character limit must be between 1 and ${MAX_TEXT_ANSWER_LENGTH}.`
      }
    }
  }
  return null
}

interface Props {
  value: ApplicationField[]
  onChange: (fields: ApplicationField[]) => void
}

// Lets a manager define the extra things applicants must provide: links, document uploads, written answers.
export function ApplicationFieldsBuilder({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<ApplicationField>) =>
    onChange(value.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const toggleFileType = (i: number, t: ApplicationFileType) => {
    const current = value[i].fileTypes ?? []
    update(i, { fileTypes: current.includes(t) ? current.filter((x) => x !== t) : [...current, t] })
  }
  const atLimit = value.length >= MAX_APPLICATION_FIELDS

  return (
    <fieldset className="space-y-3 rounded-lg border border-zinc-800 p-4">
      <legend className="px-1 text-sm font-medium text-zinc-200">Application form</legend>
      <p className="text-xs text-zinc-500">
        Applicants always give their name, email, phone and CV. Add anything else you need from them.
      </p>

      {value.map((f, i) => {
        const meta = TYPE_META[f.type]
        const Icon = meta.icon
        return (
          <div key={f.id} className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e78a53]/15 px-2.5 py-0.5 text-xs font-medium text-[#e78a53]">
                <Icon className="size-3.5" /> {meta.label}
              </span>
              <label className="ml-auto flex items-center gap-1.5 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) => update(i, { required: e.target.checked })}
                  className="accent-[#e78a53]"
                />
                Required
              </label>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="rounded p-1 text-zinc-400 hover:text-white disabled:opacity-30" aria-label="Move up">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1}
                className="rounded p-1 text-zinc-400 hover:text-white disabled:opacity-30" aria-label="Move down">
                <ArrowDown className="size-4" />
              </button>
              <button type="button" onClick={() => remove(i)}
                className="rounded p-1 text-zinc-400 hover:text-red-400" aria-label={`Remove ${f.label || meta.label}`}>
                <Trash2 className="size-4" />
              </button>
            </div>

            <Input
              aria-label="Field title"
              placeholder={meta.placeholder}
              value={f.label}
              maxLength={80}
              onChange={(e) => update(i, { label: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
            <Input
              aria-label="Instructions for applicants (optional)"
              placeholder="Instructions for applicants (optional)"
              value={f.helpText ?? ""}
              maxLength={300}
              onChange={(e) => update(i, { helpText: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />

            {f.type === "FILE" && (
              <div>
                <p className="mb-1.5 text-xs text-zinc-400">Allowed file types</p>
                <div className="flex flex-wrap gap-1.5">
                  {FILE_TYPE_KEYS.map((t) => {
                    const on = f.fileTypes?.includes(t) ?? false
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleFileType(i, t)}
                        className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                          on
                            ? "border-[#e78a53] bg-[#e78a53]/15 text-[#e78a53]"
                            : "border-zinc-700 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {APPLICATION_FILE_TYPES[t].label}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">Max 10 MB per file.</p>
              </div>
            )}

            {f.type === "TEXT" && (
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                Character limit
                <Input
                  type="number"
                  min={1}
                  max={MAX_TEXT_ANSWER_LENGTH}
                  value={f.maxLength ?? ""}
                  onChange={(e) => update(i, { maxLength: e.target.value ? Number(e.target.value) : null })}
                  className="h-8 w-28 bg-zinc-800 border-zinc-700 text-white"
                />
              </label>
            )}
          </div>
        )
      })}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_META) as ApplicationFieldType[]).map((type) => {
          const Icon = TYPE_META[type].icon
          return (
            <button
              key={type}
              type="button"
              disabled={atLimit}
              onClick={() => onChange([...value, newField(type)])}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:border-[#e78a53] hover:text-white disabled:opacity-40"
            >
              <Plus className="size-3.5" /> <Icon className="size-3.5" /> {TYPE_META[type].label}
            </button>
          )
        })}
      </div>
      {atLimit && <p className="text-xs text-zinc-500">Maximum of {MAX_APPLICATION_FIELDS} fields reached.</p>}
    </fieldset>
  )
}
