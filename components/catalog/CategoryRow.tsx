"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateCategoryFormAction,
  deleteCategoryFormAction,
} from "@/modules/catalog/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { ProductCategory } from "@/types";

type CategoryRowProps = {
  category: ProductCategory;
};

export function CategoryRow({ category }: CategoryRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set("categoryId", category.id);
    fd.set("name", name);
    await updateCategoryFormAction(fd);
    setEditing(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete category "${category.name}"? Products will be uncategorized.`)) {
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.set("categoryId", category.id);
    await deleteCategoryFormAction(fd);
    setLoading(false);
    router.refresh();
  }

  if (editing) {
    return (
      <li className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
        <form onSubmit={handleUpdate} className="flex flex-1 items-center gap-3">
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={loading}>
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(false);
              setName(category.name);
            }}
          >
            Cancel
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3">
      <div>
        <span>{category.name}</span>
        <span className="ml-3 font-mono text-xs text-muted">{category.slug}</span>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => setEditing(true)}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={handleDelete}
          className="text-red-400 hover:text-red-300"
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
