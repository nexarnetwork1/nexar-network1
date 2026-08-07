"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { NetworkPersonProfile, NetworkProfile, NetworkProfileData } from "@/modules/atlas-network/types";
import { updateNetworkProfileAction, uploadNetworkMediaAction } from "@/modules/atlas-network/actions";
import { AiAssistMenu } from "@/components/atlas/ai/AiAssistMenu";
import type { UpdatePersonProfileInput } from "@/modules/atlas-network/validators";

const DRAFT_KEY = "atlas-profile-edit-draft";

type ProfileEditFormProps = {
  profile: NetworkProfile;
  person: NetworkPersonProfile | null;
};

type FormState = UpdatePersonProfileInput;

function buildInitialState(profile: NetworkProfile, person: NetworkPersonProfile | null): FormState {
  const data = (profile.profile_data ?? {}) as NetworkProfileData;
  return {
    displayName: profile.display_name,
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    avatarUrl: profile.avatar_url,
    coverUrl: profile.cover_url,
    privacy: profile.privacy,
    location: data.location ?? "",
    website: data.website ?? "",
    walletAddress: data.walletAddress ?? "",
    languages: data.languages ?? [],
    socialLinks: data.socialLinks ?? [],
    skills: (person?.skills ?? []) as FormState["skills"],
    experience: (person?.experience ?? []) as FormState["experience"],
    education: (person?.education ?? []) as FormState["education"],
    certificates: (person?.certificates ?? []) as FormState["certificates"],
  };
}

export function ProfileEditForm({ profile, person }: ProfileEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialState(profile, person));
  const [draftSaved, setDraftSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${DRAFT_KEY}:${profile.id}`);
      if (raw) {
        const draft = JSON.parse(raw) as FormState;
        setForm((prev) => ({ ...prev, ...draft }));
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, [profile.id]);

  const scheduleDraftSave = useCallback(
    (next: FormState) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(`${DRAFT_KEY}:${profile.id}`, JSON.stringify(next));
          setDraftSaved(true);
          setTimeout(() => setDraftSaved(false), 2000);
        } catch {
          /* storage full */
        }
      }, 800);
    },
    [profile.id],
  );

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      scheduleDraftSave(next);
      return next;
    });
  };

  const handleUpload = async (file: File, kind: "avatar" | "cover") => {
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadNetworkMediaAction(fd);
      if (kind === "avatar") updateField("avatarUrl", result.url);
      else updateField("coverUrl", result.url);
      toast.success(`${kind === "avatar" ? "Avatar" : "Cover"} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (!form.displayName || form.displayName.length < 2) {
          toast.error("Display name must be at least 2 characters");
          return;
        }
        await updateNetworkProfileAction({
          ...form,
          headline: form.headline || null,
          bio: form.bio || null,
          location: form.location || null,
          website: form.website || null,
          walletAddress: form.walletAddress || null,
        });
        localStorage.removeItem(`${DRAFT_KEY}:${profile.id}`);
        toast.success("Profile saved");
        router.push("/atlas/profile");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  const clearDraft = () => {
    localStorage.removeItem(`${DRAFT_KEY}:${profile.id}`);
    setForm(buildInitialState(profile, person));
    toast.success("Draft cleared");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {draftSaved ? "Draft saved locally" : "Changes autosave as draft"}
        </p>
        <button
          type="button"
          onClick={clearDraft}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-white"
        >
          <Trash2 className="h-3 w-3" />
          Clear draft
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <UploadField
          label="Avatar"
          url={form.avatarUrl ?? null}
          uploading={uploading === "avatar"}
          onPick={() => avatarRef.current?.click()}
        />
        <UploadField
          label="Cover photo"
          url={form.coverUrl ?? null}
          uploading={uploading === "cover"}
          onPick={() => coverRef.current?.click()}
          wide
        />
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f, "avatar");
          }}
        />
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f, "cover");
          }}
        />
      </div>

      <Field label="Display name" required>
        <input
          value={form.displayName ?? ""}
          onChange={(e) => updateField("displayName", e.target.value)}
          className={inputClass}
          minLength={2}
          maxLength={120}
          required
        />
      </Field>

      <Field label="Headline">
        <input
          value={form.headline ?? ""}
          onChange={(e) => updateField("headline", e.target.value)}
          className={inputClass}
          maxLength={200}
        />
      </Field>

      <Field label="Bio">
        <div className="space-y-2">
          <AiAssistMenu
            surface="company"
            text={form.bio ?? form.headline ?? form.displayName ?? ""}
            context={{
              companyName: form.displayName,
              industry: form.headline,
            }}
            onApply={(content, action) => {
              if (action === "company_mission" || action === "company_vision") {
                updateField("headline", content.split("\n")[0]?.trim() ?? content);
              } else {
                updateField("bio", content);
              }
            }}
          />
          <textarea
          value={form.bio ?? ""}
          onChange={(e) => updateField("bio", e.target.value)}
          className={inputClass}
          rows={4}
          maxLength={2000}
        />
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Location">
          <input
            value={form.location ?? ""}
            onChange={(e) => updateField("location", e.target.value)}
            className={inputClass}
            maxLength={200}
          />
        </Field>
        <Field label="Website">
          <input
            type="url"
            value={form.website ?? ""}
            onChange={(e) => updateField("website", e.target.value)}
            className={inputClass}
            placeholder="https://"
          />
        </Field>
      </div>

      <Field label="Wallet address">
        <input
          value={form.walletAddress ?? ""}
          onChange={(e) => updateField("walletAddress", e.target.value)}
          className={inputClass}
          maxLength={100}
        />
      </Field>

      <Field label="Languages (comma-separated)">
        <input
          value={(form.languages ?? []).join(", ")}
          onChange={(e) =>
            updateField(
              "languages",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          className={inputClass}
        />
      </Field>

      <Field label="Skills (one per line: Name | Level)">
        <textarea
          value={(form.skills ?? [])
            .map((s) => [s?.name, s?.level].filter(Boolean).join(" | "))
            .join("\n")}
          onChange={(e) =>
            updateField(
              "skills",
              e.target.value
                .split("\n")
                .map((line) => {
                  const [name, level] = line.split("|").map((s) => s.trim());
                  return name ? { name, level: level || undefined } : null;
                })
                .filter(Boolean) as FormState["skills"],
            )
          }
          className={inputClass}
          rows={3}
        />
      </Field>

      <Field label="Experience (one block per line: Title | Company | Dates)">
        <textarea
          value={(form.experience ?? [])
            .map((e) =>
              [e?.title, e?.company, [e?.startDate, e?.endDate].filter(Boolean).join("–")]
                .filter(Boolean)
                .join(" | "),
            )
            .join("\n")}
          onChange={(e) =>
            updateField(
              "experience",
              e.target.value
                .split("\n")
                .map((line) => {
                  const [title, company, dates] = line.split("|").map((s) => s.trim());
                  if (!title) return null;
                  const [startDate, endDate] = (dates ?? "").split("–").map((s) => s.trim());
                  return { title, company, startDate, endDate };
                })
                .filter(Boolean) as FormState["experience"],
            )
          }
          className={inputClass}
          rows={4}
        />
      </Field>

      <Field label="Education (School | Degree | Year)">
        <textarea
          value={(form.education ?? [])
            .map((e) => [e?.school, e?.degree, e?.year].filter(Boolean).join(" | "))
            .join("\n")}
          onChange={(e) =>
            updateField(
              "education",
              e.target.value
                .split("\n")
                .map((line) => {
                  const [school, degree, year] = line.split("|").map((s) => s.trim());
                  return school ? { school, degree, year } : null;
                })
                .filter(Boolean) as FormState["education"],
            )
          }
          className={inputClass}
          rows={3}
        />
      </Field>

      <Field label="Certificates (Name | Issuer | Year)">
        <textarea
          value={(form.certificates ?? [])
            .map((c) => [c?.name, c?.issuer, c?.year].filter(Boolean).join(" | "))
            .join("\n")}
          onChange={(e) =>
            updateField(
              "certificates",
              e.target.value
                .split("\n")
                .map((line) => {
                  const [name, issuer, year] = line.split("|").map((s) => s.trim());
                  return name ? { name, issuer, year } : null;
                })
                .filter(Boolean) as FormState["certificates"],
            )
          }
          className={inputClass}
          rows={3}
        />
      </Field>

      <Field label="Social links (Platform | URL)">
        <textarea
          value={(form.socialLinks ?? [])
            .map((l) => `${l.platform} | ${l.url}`)
            .join("\n")}
          onChange={(e) =>
            updateField(
              "socialLinks",
              e.target.value
                .split("\n")
                .map((line) => {
                  const [platform, url] = line.split("|").map((s) => s.trim());
                  return platform && url ? { platform, url } : null;
                })
                .filter(Boolean) as FormState["socialLinks"],
            )
          }
          className={inputClass}
          rows={3}
          placeholder="LinkedIn | https://linkedin.com/in/you"
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-background font-medium disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save profile
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

function UploadField({
  label,
  url,
  uploading,
  onPick,
  wide,
}: {
  label: string;
  url: string | null;
  uploading: boolean;
  onPick: () => void;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-sm font-medium mb-2">{label}</p>
      <button
        type="button"
        onClick={onPick}
        disabled={uploading}
        className="relative w-full h-24 rounded-lg border border-dashed border-white/20 bg-white/5 hover:border-gold/30 overflow-hidden flex items-center justify-center gap-2 text-sm text-muted"
      >
        {url ? (
          <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        ) : null}
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin relative z-10" />
        ) : (
          <>
            <Upload className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Upload {label.toLowerCase()}</span>
          </>
        )}
      </button>
    </div>
  );
}
