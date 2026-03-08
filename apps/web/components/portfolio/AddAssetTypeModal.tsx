"use client";

import { useState, useEffect } from "react";
import { LayoutGrid } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface AddAssetTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    color: string;
  }) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  assetType?: { id: string; name: string; color: string } | null;
  existingClasses?: { name: string; color: string; id: string }[];
}

export function AddAssetTypeModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  assetType,
  existingClasses = [],
}: AddAssetTypeModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("bg-indigo-500");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (assetType) {
        setName(assetType.name);
        setColor(assetType.color);
      } else {
        setName("");
        setColor("bg-indigo-500");
      }
    }
  }, [assetType, isOpen]);

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

    const isDuplicate = existingClasses.some(
      (c) =>
        c.name.toLowerCase() === name.trim().toLowerCase() &&
        c.color === color &&
        c.id !== assetType?.id,
    );

    if (isDuplicate) {
      toast.error("This class name and color combination already exists.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ id: assetType?.id, name, color });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assetType || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(assetType.id);
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
      title={assetType ? "Class Refinement" : "New Asset Class"}
      maxWidth="max-w-sm"
      footer={
        <div className="flex gap-3 w-full">
          {assetType && onDelete && (
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
            {assetType ? "Commit" : "Create"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Class Label
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving || isDeleting}
            placeholder="e.g. Equity, Gold..."
            className="w-full h-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Visual Identity
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
                }`}
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
