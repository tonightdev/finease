"use client";

import { useState, useRef } from "react";
import { Upload, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { parseFinancialCSV, ParsedTransaction } from "@/lib/csv-parser";
import toast from "react-hot-toast";

interface FileUploadZoneProps {
  onTransactionsParsed: (transactions: ParsedTransaction[]) => void;
}


export function FileUploadZone({ onTransactionsParsed }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file.");
      return;
    }

    setIsProcessing(true);
    const text = await file.text();
    const parsed = parseFinancialCSV(text);
    
    // Simulate some "smart" processing delay
    setTimeout(() => {
      onTransactionsParsed(parsed);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <Card 
      className={`border-dashed border-2 py-10 transition-all ${
        isDragging ? "border-primary bg-primary/5" : "border-slate-200 dark:border-border-dark"
      }`}
    >
      <div 
        className="flex flex-col items-center justify-center text-center cursor-pointer"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-4 bg-primary/10 rounded-full text-primary mb-4">
          <Upload className={`w-8 h-8 ${isProcessing ? "animate-bounce" : ""}`} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
            {isProcessing ? "Processing Statement..." : "Upload Bank Statement"}
          </h4>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            Drag and drop your HDFC, ICICI, or SBI CSV statement here to stage transactions.
          </p>
        </div>
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
        />
        
        <div className="mt-6 flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-500" /> Secure
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-500" /> Private
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-500" /> instant
          </div>
        </div>
      </div>
    </Card>
  );
}
