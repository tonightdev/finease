"use client";

import { useState, useEffect } from "react";
import { LayoutGrid } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    color: string;
    parentType?: string;
  }) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  category?: {
    id: string;
    name: string;
    color: string;
    parentType?: string;
  } | null;
  existingCategories?: { name: string; color: string; id: string }[];
}

export function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  category,
  existingCategories = [],
}: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("bg-indigo-500");
  const [parentType, setParentType] = useState("needs");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name);
        setColor(category.color);
        setParentType(category.parentType || "needs");
      } else {
        setName("");
        setColor("bg-indigo-500");
        setParentType("needs");
      }
    }
  }, [category, isOpen]);

  const colors = [
    "bg-indigo-500",
    "bg-orange-500",
    "bg-blue-500",
    "bg-pink-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-amber-500",
  ];

  const handleSave = async () => {
    if (!name.trim()) return;

    // Validation: String and Color should not be the same as another item
    const isDuplicate = existingCategories.some(
      (c) =>
        c.name.toLowerCase() === name.trim().toLowerCase() &&
        c.color === color &&
        c.id !== category?.id,
    );

    if (isDuplicate) {
      toast.error("This exact label and color combination already exists.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ id: category?.id, name, color, parentType });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(category.id);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Taxonomy Refinement" : "New Category Node"}
      maxWidth="max-w-sm"
      footer={
        <div className="flex gap-3 w-full">
          {category && onDelete && (
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={isSaving}
              className="flex-1"
            >
              Scrap
            </Button>
          )}
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isDeleting || !name.trim()}
            className="flex-[2]"
            leftIcon={<LayoutGrid className="w-4 h-4" />}
          >
            {category ? "Commit" : "Create"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Label
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving || isDeleting}
            placeholder="e.g. Grocery, SaaS..."
            className="w-full h-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Spending Bucket
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl ring-1 ring-slate-100 dark:ring-white/5">
            {["needs", "wants", "savings"].map((type) => (
              <button
                key={type}
                disabled={isSaving || isDeleting}
                onClick={() => setParentType(type)}
                className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  parentType === type
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-slate-500"
                } disabled:opacity-50`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Theme Color
          </label>
          <div className="flex flex-wrap gap-2.5 px-1 py-1">
            {colors.map((c) => (
              <button
                key={c}
                disabled={isSaving || isDeleting}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full ${c} transition-all active:scale-90 flex items-center justify-center ${
                  color === c
                    ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 shadow-lg"
                    : ""
                } disabled:opacity-50`}
              >
                {color === c && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
