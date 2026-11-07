"use client";

import { useState, useEffect } from "react";
import { Bell, IndianRupee } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Expiry } from "@repo/types";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { DateInput } from "@/components/ui/DateInput";

interface AddExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Expiry, "id" | "userId" | "createdAt">,
  ) => Promise<void> | void;
  expiry?: Expiry | null;
}

export function AddExpiryModal({
  isOpen,
  onClose,
  onSave,
  expiry,
}: AddExpiryModalProps) {
  const [formData, setFormData] = useState<
    Omit<Expiry, "id" | "userId" | "createdAt">
  >({
    name: "",
    type: "policy",
    expiryDate: "",
    renewalAmount: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (expiry) {
      setFormData({
        name: expiry.name,
        type: expiry.type,
        expiryDate: expiry.expiryDate.split("T")[0] || "",
        renewalAmount: expiry.renewalAmount,
        metadata: expiry.metadata || {},
      });
    } else {
      setFormData({
        name: "",
        type: "policy",
        expiryDate: "",
        renewalAmount: 0,
        metadata: {},
      });
    }
  }, [expiry, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
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
      title={expiry ? "Update Sequence" : "New Expiry Node"}
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            Abort
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="flex-[2]"
            leftIcon={<Bell className="w-4 h-4" />}
          >
            Add Expiry
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Expiry Identifier
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. LIC Policy, Passport Expiry"
            className="h-12 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Expiry Category
            </label>
            <NativeSelect
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as Expiry["type"],
                })
              }
              className="h-12 text-sm"
            >
              <option value="document">Document</option>
              <option value="other">Other</option>
              <option value="policy">Policy</option>
            </NativeSelect>
          </div>
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Renewal Magnitude
            </label>
            <div className="relative">
              <AmountInput
                value={String(formData.renewalAmount || "")}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    renewalAmount: Number(val),
                  })
                }
                disabled={isSaving}
                className="pl-10"
                placeholder="0.00"
              />
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div>
          <DateInput
            label="Horizon Date (Expiration)"
            value={formData.expiryDate}
            onChange={(e) =>
              setFormData({ ...formData, expiryDate: e.target.value })
            }
            disabled={isSaving}
          />
        </div>
      </div>
    </Modal>
  );
}
