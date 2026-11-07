"use client";

import { useState, useEffect } from "react";
import { Flag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";
import { Input } from "@/components/ui/Input";
import { DateInput } from "@/components/ui/DateInput";

interface GoalFormData {
  name: string;
  targetAmount: number;
  targetDate: string;
}

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalId: string | null, data: GoalFormData) => Promise<void> | void;
  editingGoal?: {
    id: string;
    name: string;
    targetAmount: number;
    targetDate: string;
  } | null;
}

export function EditGoalModal({
  isOpen,
  onClose,
  onSave,
  editingGoal,
}: EditGoalModalProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    name: "",
    targetAmount: 0,
    targetDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        name: editingGoal.name,
        targetAmount: editingGoal.targetAmount,
        targetDate: editingGoal.targetDate,
      });
    } else {
      setFormData({ name: "", targetAmount: 0, targetDate: "" });
    }
  }, [editingGoal, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editingGoal?.id || null, formData);
      onClose();
    } catch {
      // Error handled by parent/toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingGoal ? "Goal Refinement" : "New Goal"}
      maxWidth="max-w-sm"
      footer={
        <div className="flex gap-3 w-full">
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
            className="flex-[2]"
            leftIcon={<Flag className="w-4 h-4" />}
          >
            Commit Goal
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Objective
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. World Tour"
            className="h-10 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Target Magnitude (₹)
          </label>
          <AmountInput
            value={String(formData.targetAmount || "")}
            onChange={(val) =>
              setFormData({ ...formData, targetAmount: Number(val) })
            }
            placeholder="0.00"
            disabled={isSaving}
          />
        </div>

        <div>
          <DateInput
            label="Horizon Date"
            value={formData.targetDate}
            onChange={(e) =>
              setFormData({ ...formData, targetDate: e.target.value })
            }
            disabled={isSaving}
          />
        </div>
      </div>
    </Modal>
  );
}
