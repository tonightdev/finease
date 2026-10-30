"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tag, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { RootState, AppDispatch } from "@/store";
import {
  fetchCategories,
  addCategoryAction,
  updateCategoryAction,
  removeCategoryAction,
} from "@/store/slices/categoriesSlice";
import { Category, CategoryParentType } from "@repo/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

const PARENT_TYPES: {
  value: CategoryParentType;
  label: string;
  color: string;
}[] = [
  { value: "income", label: "Income", color: "#6366f1" },
  { value: "needs", label: "Needs", color: "#3b82f6" },
  { value: "savings", label: "Savings", color: "#10b981" },
  { value: "wants", label: "Wants", color: "#f97316" },
];

const PRESET_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#f43f5e",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
  "#14b8a6",
  "#64748b",
];

interface CategoryFormState {
  name: string;
  color: string;
  type: "expense" | "income";
  parentType: CategoryParentType;
}

const DEFAULT_FORM: CategoryFormState = {
  name: "",
  color: "#6366f1",
  type: "expense",
  parentType: "needs",
};

interface CategoryFormProps {
  initial?: CategoryFormState;
  onSave: (data: CategoryFormState) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

function CategoryForm({
  initial = DEFAULT_FORM,
  onSave,
  onCancel,
  isEdit,
}: CategoryFormProps) {
  const [form, setForm] = useState<CategoryFormState>(initial);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
          Category Name
        </label>
        <input
          autoFocus
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Groceries"
          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
          Type
        </label>
        <div className="flex gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  type: t,
                  parentType:
                    t === "income"
                      ? "income"
                      : f.parentType === "income"
                        ? "needs"
                        : f.parentType,
                }));
              }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                form.type === t
                  ? t === "income"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                    : "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
          Budget Category
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PARENT_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  parentType: pt.value,
                  type:
                    pt.value === "income"
                      ? "income"
                      : f.type === "income"
                        ? "expense"
                        : f.type,
                }));
              }}
              className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                form.parentType === pt.value
                  ? "text-white shadow-md"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
              }`}
              style={
                form.parentType === pt.value
                  ? {
                      backgroundColor: pt.color,
                      boxShadow: `0 4px 12px ${pt.color}40`,
                    }
                  : {}
              }
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    form.parentType === pt.value ? "white" : pt.color,
                }}
              />
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
          Colour
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              className="size-7 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: c,
                borderColor: form.color === c ? "white" : "transparent",
                outline: form.color === c ? `2px solid ${c}` : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="size-7 rounded-lg cursor-pointer border border-slate-200 dark:border-white/10"
            title="Custom colour"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          disabled={saving}
          className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl gap-1.5"
        >
          <Check size={13} />
          {saving ? "Saving..." : isEdit ? "Update" : "Create"}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <X size={13} />
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CategoriesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.categories.items);
  const loading = useSelector((state: RootState) => state.categories.loading);

  const [filterType, setFilterType] = useState<"all" | "expense" | "income">(
    "all",
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    dispatch(fetchCategories({ force: true }));
  }, [dispatch]);

  // Group and sort categories according to requested hierarchy
  // "all": incomes, needs, saving, wants
  // "expense": needs, saving, wants
  // "income": incomes
  const groupedCategories = useMemo(() => {
    type GroupDef = {
      key: CategoryParentType | "other";
      label: string;
      color: string;
      matcher: (c: Category) => boolean;
    };

    let groupDefs: GroupDef[] = [];

    if (filterType === "all") {
      groupDefs = [
        {
          key: "income",
          label: "Incomes",
          color: "#6366f1",
          matcher: (c) => c.type === "income" || c.parentType === "income",
        },
        {
          key: "needs",
          label: "Needs",
          color: "#3b82f6",
          matcher: (c) =>
            c.type !== "income" &&
            c.parentType !== "income" &&
            (c.parentType === "needs" || !c.parentType),
        },
        {
          key: "savings",
          label: "Savings",
          color: "#10b981",
          matcher: (c) =>
            c.type !== "income" &&
            c.parentType !== "income" &&
            c.parentType === "savings",
        },
        {
          key: "wants",
          label: "Wants",
          color: "#f97316",
          matcher: (c) =>
            c.type !== "income" &&
            c.parentType !== "income" &&
            c.parentType === "wants",
        },
        {
          key: "other",
          label: "Other",
          color: "#64748b",
          matcher: (c) =>
            c.type !== "income" &&
            c.parentType !== "income" &&
            c.parentType !== "needs" &&
            c.parentType !== "savings" &&
            c.parentType !== "wants",
        },
      ];
    } else if (filterType === "expense") {
      groupDefs = [
        {
          key: "needs",
          label: "Needs",
          color: "#3b82f6",
          matcher: (c) =>
            c.type !== "income" && (c.parentType === "needs" || !c.parentType),
        },
        {
          key: "savings",
          label: "Savings",
          color: "#10b981",
          matcher: (c) => c.type !== "income" && c.parentType === "savings",
        },
        {
          key: "wants",
          label: "Wants",
          color: "#f97316",
          matcher: (c) => c.type !== "income" && c.parentType === "wants",
        },
        {
          key: "other",
          label: "Other",
          color: "#64748b",
          matcher: (c) =>
            c.type !== "income" &&
            c.parentType !== "needs" &&
            c.parentType !== "savings" &&
            c.parentType !== "wants",
        },
      ];
    } else {
      // Income tab
      groupDefs = [
        {
          key: "income",
          label: "Incomes",
          color: "#6366f1",
          matcher: (c) => c.type === "income" || c.parentType === "income",
        },
      ];
    }

    return groupDefs
      .map((g) => {
        const items = categories
          .filter(g.matcher)
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
          );
        return {
          ...g,
          items,
        };
      })
      .filter((g) => g.items.length > 0);
  }, [categories, filterType]);

  const totalFilteredCount = useMemo(
    () => groupedCategories.reduce((sum, g) => sum + g.items.length, 0),
    [groupedCategories],
  );

  const getParentBadge = (pt?: CategoryParentType) => {
    return (
      PARENT_TYPES.find((p) => p.value === pt) ?? {
        label: "Other",
        color: "#64748b",
      }
    );
  };

  const defaultFormState: CategoryFormState = useMemo(() => {
    if (filterType === "income") {
      return {
        name: "",
        color: "#6366f1",
        type: "income",
        parentType: "income",
      };
    }
    return {
      name: "",
      color: "#6366f1",
      type: "expense",
      parentType: "needs",
    };
  }, [filterType]);

  const handleAdd = async (data: CategoryFormState) => {
    try {
      await dispatch(
        addCategoryAction({
          name: data.name,
          color: data.color,
          type: data.type,
          parentType: data.parentType,
        }),
      ).unwrap();
      toast.success("Category created");
      setIsAddOpen(false);
    } catch {
      toast.error("Failed to create category");
      throw new Error("failed");
    }
  };

  const handleEdit = async (data: CategoryFormState) => {
    if (!editingCategory) return;
    try {
      await dispatch(
        updateCategoryAction({
          id: editingCategory.id,
          data: {
            name: data.name,
            color: data.color,
            type: data.type,
            parentType: data.parentType,
          },
        }),
      ).unwrap();
      toast.success("Category updated");
      setEditingCategory(null);
    } catch {
      toast.error("Failed to update category");
      throw new Error("failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    try {
      await dispatch(removeCategoryAction(id)).unwrap();
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-full sm:w-auto">
          {(["all", "expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setFilterType(t);
                setEditingCategory(null);
              }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                filterType === t
                  ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t === "all" ? "All" : t === "expense" ? "Expenses" : "Income"}
            </button>
          ))}
        </div>

        <Button
          onClick={() => {
            setEditingCategory(null);
            setIsAddOpen((v) => !v);
          }}
          className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xs"
        >
          <Plus size={14} /> Add Category
        </Button>
      </div>

      {/* Inline Add Form */}
      {isAddOpen && (
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-primary/30 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
            New Category
          </p>
          <CategoryForm
            initial={defaultFormState}
            onSave={handleAdd}
            onCancel={() => setIsAddOpen(false)}
          />
        </div>
      )}

      {/* Category Groups */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : totalFilteredCount === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
          <div className="size-16 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center mx-auto mb-4">
            <Tag className="size-8 text-primary/40" />
          </div>
          <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1.5">
            No categories found
          </h5>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
            Create categories to organise transactions and strategies.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedCategories.map((group) => (
            <div key={group.key} className="space-y-3">
              {/* Group Section Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shadow-xs"
                    style={{ backgroundColor: group.color }}
                  />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    {group.label}
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                    {group.items.length}
                  </span>
                </div>
              </div>

              {/* Grid of categories in this group */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {group.items.map((cat) => {
                  const parentBadge = getParentBadge(cat.parentType);
                  const isEditing = editingCategory?.id === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xs group hover:border-primary/40 transition-all flex flex-col"
                    >
                      {/* Colour accent bar */}
                      <div
                        className="h-1 w-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />

                      <div className="p-3 sm:p-4 space-y-2.5 flex-1 flex flex-col">
                        {isEditing ? (
                          <CategoryForm
                            initial={{
                              name: cat.name,
                              color: cat.color,
                              type:
                                (cat.type as "expense" | "income") ?? "expense",
                              parentType: cat.parentType ?? "needs",
                            }}
                            isEdit
                            onSave={handleEdit}
                            onCancel={() => setEditingCategory(null)}
                          />
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                <div
                                  className="size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                                  style={{
                                    backgroundColor: `${cat.color}20`,
                                    color: cat.color,
                                  }}
                                >
                                  <Tag className="size-4 sm:size-4.5" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                    {cat.name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span
                                      className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md"
                                      style={{
                                        backgroundColor: `${parentBadge.color}20`,
                                        color: parentBadge.color,
                                      }}
                                    >
                                      {parentBadge.label}
                                    </span>
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                                        cat.type === "income"
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                      }`}
                                    >
                                      {cat.type ?? "expense"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-100 dark:border-white/5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsAddOpen(false);
                                  setEditingCategory(cat);
                                }}
                                className="flex-1 h-8 rounded-lg font-black text-[8px] uppercase tracking-widest border-slate-200 dark:border-white/10 gap-1"
                              >
                                <Pencil size={11} /> Edit
                              </Button>
                              <button
                                type="button"
                                onClick={() => handleDelete(cat.id)}
                                className="size-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 flex items-center justify-center shrink-0 cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
