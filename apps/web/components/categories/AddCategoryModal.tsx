"use client";

import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CategoryParentType } from "@repo/types";
import toast from "react-hot-toast";

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

export interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    color: string;
    parentType?: CategoryParentType;
    type?: "expense" | "income";
  }) => Promise<void> | void;
  category?: {
    id: string;
    name: string;
    color: string;
    parentType?: string;
    type?: "expense" | "income";
  } | null;
  existingCategories?: { name: string; color: string; id: string }[];
  defaultType?: "expense" | "income";
  defaultParentType?: CategoryParentType;
}

export function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
  existingCategories = [],
  defaultType = "expense",
  defaultParentType = "needs",
}: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [parentType, setParentType] = useState<CategoryParentType>("needs");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name);
        setColor(category.color || "#6366f1");
        const resolvedType =
          category.type ||
          (category.parentType === "income" ? "income" : "expense");
        setType(resolvedType);
        setParentType(
          (category.parentType as CategoryParentType) ||
            (resolvedType === "income" ? "income" : "needs"),
        );
      } else {
        setName("");
        setColor("#6366f1");
        setType(defaultType);
        setParentType(
          defaultParentType || (defaultType === "income" ? "income" : "needs"),
        );
      }
    }
  }, [category, isOpen, defaultType, defaultParentType]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    const isDuplicate = existingCategories.some(
      (c) =>
        c.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        c.color === color &&
        c.id !== category?.id,
    );

    if (isDuplicate) {
      toast.error("A category with this exact name and colour already exists.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: category?.id,
        name: name.trim(),
        color,
        parentType,
        type,
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Edit Category" : "Add Category"}
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-2 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!name.trim()}
            className="flex-[2]"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {category ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Category Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Category Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            placeholder="e.g. Groceries, SaaS, Salary..."
            className="w-full h-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 disabled:opacity-50"
          />
        </div>

        {/* Type Toggle: Expense / Income */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Type
          </label>
          <div className="flex gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setType(t);
                  if (t === "income") {
                    setParentType("income");
                  } else if (parentType === "income") {
                    setParentType("needs");
                  }
                }}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  type === t
                    ? t === "income"
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                      : "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                    : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
                } disabled:opacity-50`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Category (parentType) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Budget Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PARENT_TYPES.map((pt) => {
              const isSelected = parentType === pt.value;
              return (
                <button
                  key={pt.value}
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setParentType(pt.value);
                    if (pt.value === "income") {
                      setType("income");
                    } else if (type === "income") {
                      setType("expense");
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "text-white shadow-md"
                      : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
                  } disabled:opacity-50`}
                  style={
                    isSelected
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
                      backgroundColor: isSelected ? "white" : pt.color,
                    }}
                  />
                  {pt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Colour */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Theme Colour
          </label>
          <div className="flex items-center gap-2 flex-wrap px-1 py-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                disabled={isSaving}
                onClick={() => setColor(c)}
                className="size-7 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "white" : "transparent",
                  outline: color === c ? `2px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
            <input
              type="color"
              disabled={isSaving}
              value={color.startsWith("#") ? color : "#6366f1"}
              onChange={(e) => setColor(e.target.value)}
              className="size-7 rounded-lg cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent disabled:opacity-50"
              title="Custom colour"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
