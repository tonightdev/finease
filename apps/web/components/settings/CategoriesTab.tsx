"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tag, Plus, Trash2, Pencil } from "lucide-react";
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
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AddCategoryModal } from "@/components/categories/AddCategoryModal";

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

export function CategoriesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.categories.items);
  const loading = useSelector((state: RootState) => state.categories.loading);

  const [filterType, setFilterType] = useState<"all" | "expense" | "income">(
    "all",
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

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

  const handleSaveCategory = async (data: {
    id?: string;
    name: string;
    color: string;
    parentType?: CategoryParentType;
    type?: "expense" | "income";
  }) => {
    try {
      if (editingCategory) {
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
      } else {
        await dispatch(
          addCategoryAction({
            name: data.name,
            color: data.color,
            type: data.type || (filterType === "income" ? "income" : "expense"),
            parentType:
              data.parentType || (filterType === "income" ? "income" : "needs"),
          }),
        ).unwrap();
        toast.success("Category created");
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      dispatch(fetchCategories({ force: true }));
    } catch {
      toast.error(
        editingCategory
          ? "Failed to update category"
          : "Failed to create category",
      );
      throw new Error("failed");
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await dispatch(removeCategoryAction(categoryToDelete.id)).unwrap();
      toast.success("Category deleted");
      setCategoryToDelete(null);
      if (isCategoryModalOpen && editingCategory?.id === categoryToDelete.id) {
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
      }
      dispatch(fetchCategories({ force: true }));
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
            setIsCategoryModalOpen(true);
          }}
          className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xs"
        >
          <Plus size={14} /> Add Category
        </Button>
      </div>

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
                              setEditingCategory(cat);
                              setIsCategoryModalOpen(true);
                            }}
                            className="flex-1 h-8 rounded-lg font-black text-[8px] uppercase tracking-widest border-slate-200 dark:border-white/10 gap-1"
                          >
                            <Pencil size={11} /> Edit
                          </Button>
                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(cat)}
                            className="size-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 flex items-center justify-center shrink-0 cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Create / Edit Modal */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        existingCategories={categories}
        defaultType={filterType === "income" ? "income" : "expense"}
        defaultParentType={filterType === "income" ? "income" : "needs"}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
      />

      {/* Category Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category?"
        message={`Are you sure you want to permanently delete "${categoryToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Category"
        isDestructive
      />
    </div>
  );
}
