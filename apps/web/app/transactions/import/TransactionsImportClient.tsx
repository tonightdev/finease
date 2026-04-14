"use client";

import { useState, useEffect } from "react";
import {
  Transaction,
  TransactionImportMapping,
  TransactionImportStage,
  RawTransactionData,
} from "@repo/types";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { createTransaction } from "@/store/slices/transactionsSlice";
import toast from "react-hot-toast";
import { formatDate, parseImportDate } from "@/lib/utils";
import {
  ChevronRight,
  FileUp,
  CloudUpload,
  ClipboardCheck,
  Settings2,
  ShieldAlert,
  AlertCircle,
  X,
  Check,
  Plus,
  Trash2,
} from "lucide-react";

import { PasswordInput } from "@/components/ui/PasswordInput";

import { PageHeader } from "@/components/ui/PageHeader";
import Papa from "papaparse";
import * as pdfjs from "pdfjs-dist";

// Set worker from CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfItem {
  str: string;
  x: number;
  y: number;
  w: number;
}

const MAPPING_FIELDS = [
  { label: "Date", key: "date", required: true },
  { label: "Description", key: "description", required: true },
  { label: "Amount (Generic/Single)", key: "amount_single", required: false },
  { label: "Withdrawal / Debit", key: "amount_debit", required: false },
  { label: "Deposit / Credit", key: "amount_credit", required: false },
  { label: "Category", key: "category", required: false },
  { label: "Type (In/Out)", key: "type", required: false },
];

export default function TransactionsImportClient() {
  const dispatch = useDispatch<AppDispatch>();
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const categories = useSelector((state: RootState) => state.categories.items);

  const [stage, setStage] = useState<TransactionImportStage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<RawTransactionData[]>([]);
  const [mappings, setMappings] = useState<Partial<TransactionImportMapping>>(
    {},
  );
  const [reviewQueue, setReviewQueue] = useState<Partial<Transaction>[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (selectedFile.type === "application/pdf") {
        processPdf(selectedFile);
      } else {
        processCsv(selectedFile);
      }
    }
  };

  const processCsv = (file: File) => {
    setIsProcessing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setRawHeaders(results.meta.fields);
          setRawData(results.data as RawTransactionData[]);
          setStage("mapping");
        }
        setIsProcessing(false);
      },
      error: (err) => {
        toast.error("Failed to parse CSV: " + err.message);
        setIsProcessing(false);
      },
    });
  };


  const addManualRow = () => {
    const newRow: Partial<Transaction> = {
      id: `manual-${Date.now()}`,
      date: new Date().toISOString(),
      description: "",
      amount: 0,
      category: "General",
      type: "expense",
      accountId: selectedAccountId,
      status: "completed",
    };
    setReviewQueue([newRow, ...reviewQueue]);
    if (stage !== "review") setStage("review");
  };

  const processPdf = async (file: File, pwd = "") => {
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        password: pwd,
      });

      loadingTask.onPassword = () => {
        setStage("password");
        setIsProcessing(false);
      };

      const pdf = await loadingTask.promise;
      const allRows: RawTransactionData[] = [];
      const sampleHeaders = [
        "Date",
        "Description",
        "Narration",
        "Amount",
        "Withdrawal",
        "Deposit",
        "Balance",
      ];

      // Robust cleaner for bank amounts
      const cleanAmt = (val: string): string => {
        if (!val) return "0";
        const cleaned = val.replace(/[^0-9.-]/g, "");
        if (cleaned === "." || !cleaned || cleaned === "-") return "0";
        return cleaned;
      };

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageItems: PdfItem[] = content.items
          .map((item: unknown) => {
            const pdfItem = item as {
              str: string;
              transform: number[];
              width: number;
            };
            return {
              str: pdfItem.str.trim(),
              x: pdfItem.transform[4] || 0,
              y: Math.round(pdfItem.transform[5] || 0),
              w: pdfItem.width || 0,
            };
          })
          .filter((it) => it.str.length > 0);

        // Group into Visual Lines with a larger 8px tolerance
        const lineBuckets: Record<number, PdfItem[]> = {};
        pageItems.forEach((it) => {
          const existingY = Object.keys(lineBuckets)
            .map(Number)
            .find((y) => Math.abs(y - it.y) <= 8);
          const targetY = existingY || it.y;
          if (!lineBuckets[targetY]) lineBuckets[targetY] = [];
          lineBuckets[targetY]!.push(it);
        });

        const sortedYs = Object.keys(lineBuckets)
          .map(Number)
          .sort((a, b) => b - a);
        let pendingRow: RawTransactionData | null = null;

        // Omni-Date Regex: DD/MM/YY, DD-MMM-YYYY, DD MMM YYYY, YYYY/MM/DD, etc.
        const omniDateRegex =
          /\b(\d{1,4})[-/.\x20](\d{1,2}|[A-Za-z]{3})[-/.\x20](\d{2,4})\b/;

        sortedYs.forEach((y) => {
          const items = lineBuckets[y]!.sort((a, b) => a.x - b.x);
          const lineText = items.map((it) => it.str).join(" ");
          const dateMatch = lineText.match(omniDateRegex);

          // Heuristic: Is this a potential new transaction line?
          const looksLikeTransaction =
            !!dateMatch ||
            items.some(
              (it) =>
                it.x > 400 &&
                /[0-9]/.test(it.str) &&
                (it.str.includes(".") || it.str.length > 4),
            );

          if (looksLikeTransaction) {
            // New row if date found or if we have no active row yet
            if (dateMatch || !pendingRow) {
              if (pendingRow) allRows.push(pendingRow);
              pendingRow = {};
              sampleHeaders.forEach((h) => (pendingRow![h] = ""));
              if (dateMatch)
                (pendingRow["Date"] as string) = dateMatch[1] || "";
            }

            // Extract numeric blocks, avoiding small single digits (except on the far right)
            const moneyItems = items.filter((it) => {
              const cleaned = it.str.replace(/,/g, "");
              const isNumeric = /[0-9]/.test(cleaned);
              const isDatePart =
                dateMatch && dateMatch[1] && it.str.includes(dateMatch[1]);
              return (
                isNumeric && !isDatePart && (cleaned.length > 3 || it.x > 350)
              );
            });

            // Map money items by visual lane (Right-Anchor Heuristic)
            if (moneyItems.length >= 1)
              (pendingRow["Balance"] as string) =
                moneyItems[moneyItems.length - 1]!.str;
            if (moneyItems.length >= 2)
              (pendingRow["Deposit"] as string) =
                moneyItems[moneyItems.length - 2]!.str;
            if (moneyItems.length >= 3)
              (pendingRow["Withdrawal"] as string) =
                moneyItems[moneyItems.length - 3]!.str;

            // Narration is all text that isn't the date or money
            const nonNarrStr = [
              pendingRow["Date"],
              pendingRow["Balance"],
              pendingRow["Deposit"],
              pendingRow["Withdrawal"],
            ];
            const narrItems = items.filter(
              (it) => !nonNarrStr.some((s) => s && it.str === s),
            );

            const newNarr = narrItems
              .map((it) => it.str)
              .join(" ")
              .trim();
            (pendingRow["Narration"] as string) = (
              pendingRow["Narration"] +
              " " +
              newNarr
            ).trim();
            (pendingRow["Description"] as string) = pendingRow[
              "Narration"
            ] as string;
          } else if (pendingRow) {
            // Pure narration continuation line
            const text = items
              .map((it) => it.str)
              .join(" ")
              .trim();
            if (text.length > 2 && !text.toLowerCase().includes("page")) {
              (pendingRow["Narration"] as string) = (
                pendingRow["Narration"] +
                " " +
                text
              ).trim();
              (pendingRow["Description"] as string) = pendingRow[
                "Narration"
              ] as string;
            }
          }
        });
        if (pendingRow) allRows.push(pendingRow);
      }

      const finalData = allRows.map((row) => ({
        ...row,
        Withdrawal: cleanAmt(row["Withdrawal"] || ""),
        Deposit: cleanAmt(row["Deposit"] || ""),
        Balance: cleanAmt(row["Balance"] || ""),
        Amount: cleanAmt(row["Amount"] || ""),
      }));

      // Acquisition results prepared for review
      // finalData logs removed for production hygiene

      setRawHeaders(sampleHeaders);
      setRawData(finalData);
      setStage("mapping");
      setIsProcessing(false);
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === "PasswordException") {
        setStage("password");
      } else {
        toast.error("PDF Error: " + err.message);
      }
      setIsProcessing(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (file) processPdf(file, password);
  };

  const startMapping = () => {
    const hasSingleAmount = !!mappings["amount_single"];
    const hasDebitCredit =
      !!mappings["amount_debit"] || !!mappings["amount_credit"];

    if (
      !mappings.date ||
      !mappings.description ||
      (!hasSingleAmount && !hasDebitCredit)
    ) {
      toast.error(
        "Required mappings missing (Date, Description, and an Amount field)",
      );
      return;
    }

    // Process starting mapping stage
    // rawData logs removed for production hygiene

    // Generate review queue from rawData + mappings
    const queue: Partial<Transaction>[] = rawData
      .map((row, idx) => {
        const dateVal = row[mappings.date!];
        const descVal = row[mappings.description!];

        let amountVal = 0;
        let type: "income" | "expense" = "expense";

        const cleanAmount = (val: string) => {
          if (!val) return 0;
          const cleaned = val.replace(/[^0-9.-]/g, "");
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        };

        if (mappings.type && row[mappings.type]) {
          const typeStr = String(row[mappings.type]).toLowerCase();
          if (
            typeStr.includes("in") ||
            typeStr.includes("cr") ||
            typeStr.includes("dep")
          ) {
            type = "income";
          } else if (
            typeStr.includes("out") ||
            typeStr.includes("dr") ||
            typeStr.includes("with")
          ) {
            type = "expense";
          }
        }

        if (hasSingleAmount) {
          amountVal = cleanAmount(
            String(row[mappings["amount_single"]!] || "0"),
          );
          // If we didn't get a type from the type column, guess from sign
          if (!mappings.type || !row[mappings.type]) {
            type = amountVal < 0 ? "expense" : "income";
          }
          amountVal = Math.abs(amountVal);
        } else {
          const debit = cleanAmount(
            String(row[mappings["amount_debit"]!] || "0"),
          );
          const credit = cleanAmount(
            String(row[mappings["amount_credit"]!] || "0"),
          );

          // If we have explicit debit/credit columns, they usually dictate the type
          if (credit !== 0) {
            amountVal = credit;
            type = "income";
          } else {
            amountVal = Math.abs(debit);
            type = "expense";
          }
        }

        const catVal = mappings.category
          ? row[mappings.category]
          : "Uncategorized";

        const parsedDate = parseImportDate(String(dateVal || ""));

        return {
          id: `import-${idx}`,
          date: parsedDate.toISOString(),
          description: descVal || "Imported Transaction",
          amount: amountVal || 0,
          category: catVal,
          type: type,
          accountId: selectedAccountId,
          status: "completed" as const,
        } as Partial<Transaction>;
      })
      .filter(
        (t): t is Partial<Transaction> =>
          !!t.description && (t.amount !== 0 || !!t.date),
      );

    setReviewQueue(queue);
    setStage("review");
  };

  const handleCommit = async () => {
    setIsProcessing(true);
    try {
      for (const tx of reviewQueue) {
        await dispatch(
          createTransaction({
            accountId: selectedAccountId,
            amount: tx.amount || 0,
            date: tx.date || new Date().toISOString(),
            description: tx.description || "Imported",
            category: tx.category || "General",
            type: (tx.type as "income" | "expense") || "expense",
            status: "completed",
          }),
        );
      }
      toast.success(`Successfully imported ${reviewQueue.length} cycles!`);
      window.location.href = "/transactions";
    } catch {
      // Import operation failed. Silently handled as per requirements.
      toast.error("Import failed halfway. Check your ledger.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title="Vault Acquisition"
        subtitle="Ingest external data streams into your private instance"
        backHref="/transactions"
        backLabel="Back to Transactions"
        actions={
          stage !== "upload" && (
            <button
              onClick={() => {
                setStage("upload");
                setFile(null);
                setRawData([]);
                setMappings({});
              }}
              className="flex items-center gap-2 px-4 h-9 rounded-xl border border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              <X className="w-3 h-3" />
              Replace File
            </button>
          )
        }
      />

      {stage === "upload" && (
        <div className="flex flex-wrap gap-8">
          <div className="flex-1 lg:flex-[2] min-w-[300px]">
            <div
              className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-8 shadow-xl transition-all ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                      Upload Statement
                    </h2>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                      PDF or CSV Formats
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <input
                  type="file"
                  accept=".csv, .pdf"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                />
                <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-16 text-center transition-all group-hover:border-primary group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/5">
                  <div className="bg-slate-50 dark:bg-white/5 rounded-3xl h-20 w-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
                    <CloudUpload className="text-slate-400 dark:text-slate-500 w-10 h-10 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                    Drop data stream here
                  </p>
                  <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest mt-3">
                    Maximum Payload: 25MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-primary/[0.03] border border-primary/10 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">
                  Security Protocols
                </h3>
              </div>
              <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                Data is processed entirely in-memory. No financial narration
                ever leaves your local environment.
              </p>
            </div>



            <button
              onClick={addManualRow}
              className="w-full h-12 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-primary hover:text-primary transition-all"
            >
              <Plus className="w-4 h-4" />
              Manual Bulk Entry
            </button>
          </div>
        </div>
      )}



      {stage === "password" && (
        <div className="max-w-md mx-auto py-12">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-8 shadow-2xl text-center">
            <div className="size-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
              Encrypted Pulse Detected
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
              Enter the master key for this statement
            </p>

            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-center text-lg font-bold focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
              containerClassName="mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStage("upload")}
                className="flex-1 h-12 rounded-2xl border border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-2 h-12 bg-primary text-white rounded-2xl px-8 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                Decrypt
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === "mapping" && (
        <div className="flex flex-wrap gap-8">
          <div className="flex-1 lg:flex-[2] min-w-[300px] space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    Protocol Alignment
                  </h2>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                    Map Source Columns to Nexus Fields
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {MAPPING_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className="flex flex-wrap items-center gap-4"
                  >
                    <label className="flex-1 min-w-[120px] text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-rose-500">*</span>
                      )}
                    </label>
                    <div className="col-span-2">
                      <select
                        value={
                          mappings[
                          field.key as keyof TransactionImportMapping
                          ] || ""
                        }
                        onChange={(e) =>
                          setMappings({
                            ...mappings,
                            [field.key]: e.target.value,
                          })
                        }
                        className="w-full h-11 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-4 text-[10px] font-black outline-none ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white"
                      >
                        <option value="">Select Stream Source</option>
                        {rawHeaders.map((h, idx) => (
                          <option key={`${h}-${idx}`} value={h}>
                            Col {idx + 1}: {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    Destination Entity
                  </h2>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                    Target Account for this payload
                  </p>
                </div>
              </div>

              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-4 text-[10px] font-black outline-none ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white"
              >
                <option value="">Select Target Account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={startMapping}
              disabled={
                !selectedAccountId ||
                !mappings.date ||
                !mappings.description ||
                (!mappings.amount_single &&
                  !mappings.amount_debit &&
                  !mappings.amount_credit)
              }
              className="w-full h-14 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
            >
              Initialize Review
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setStage("upload")}
              className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
            >
              Discard Acquisition
            </button>

            <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                  Validation Rules
                </h3>
              </div>
              <ul className="space-y-3">
                {MAPPING_FIELDS.filter((f) => f.required).map((f) => (
                  <li key={f.key} className="flex items-center gap-2">
                    <div
                      className={`size-1.5 rounded-full ${mappings[f.key as keyof TransactionImportMapping] ? "bg-emerald-500" : "bg-slate-300"}`}
                    />
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest ${mappings[f.key as keyof TransactionImportMapping] ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      {f.label} Mapping
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {stage === "review" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <ClipboardCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  Acquisition Review
                </h2>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                  {reviewQueue.length} Cycles Ready for Injection
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStage("mapping")}
                className="px-6 h-10 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
              >
                Back to Mapping
              </button>
              <button
                onClick={handleCommit}
                className="bg-primary text-white rounded-xl px-8 h-10 hover:scale-[1.03] active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                Inject into Ledger
              </button>
            </div>
          </div>

          <div className="lg:hidden space-y-3">
            {reviewQueue.map((t, idx) => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      Narration
                    </label>
                    <input
                      value={t.description}
                      onChange={(e) => {
                        const q = [...reviewQueue];
                        q[idx]!.description = e.target.value;
                        setReviewQueue(q);
                      }}
                      className="bg-transparent border-none p-0 w-full text-[10px] font-black focus:ring-0 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() =>
                      setReviewQueue(reviewQueue.filter((_, i) => i !== idx))
                    }
                    className="size-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50 dark:border-white/5">
                  <div className="flex-1 min-w-[100px] space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      Timeline
                    </label>
                    <p className="text-[10px] font-bold text-slate-500">
                      {formatDate(t.date || new Date().toISOString())}
                    </p>
                  </div>
                  <div className="flex-1 min-w-[100px] space-y-1 text-right">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      Quantum
                    </label>
                    <div
                      className={`text-[11px] font-black ${t.type === "expense" ? "text-rose-500" : "text-emerald-500"}`}
                    >
                      {t.type === "expense" ? "-" : "+"} ₹
                      {t.amount?.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      Category
                    </label>
                    <select
                      value={t.category}
                      onChange={(e) => {
                        const q = [...reviewQueue];
                        q[idx]!.category = e.target.value;
                        setReviewQueue(q);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl h-10 px-3 text-[10px] font-black outline-none ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary"
                    >
                      <option value="Uncategorized">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {reviewQueue.length === 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-12 text-center">
                <ClipboardCheck className="size-12 text-slate-100 dark:text-white/5 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Acquisition channel empty
                </p>
              </div>
            )}
          </div>

          <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto overflow-y-hidden">
              <table className="w-full text-left">
                <thead className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 dark:bg-white/5 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4">Narration</th>
                    <th className="px-6 py-4">Nexus Category</th>
                    <th className="px-6 py-4 text-right">Quantum</th>
                    <th className="px-3 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {reviewQueue.map((t, idx) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group"
                    >
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                        {formatDate(t.date || new Date().toISOString())}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          value={t.description}
                          onChange={(e) => {
                            const q = [...reviewQueue];
                            q[idx]!.description = e.target.value;
                            setReviewQueue(q);
                          }}
                          className="bg-transparent border-none p-0 w-full text-[10px] font-black focus:ring-0 outline-none text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={t.category}
                          onChange={(e) => {
                            const q = [...reviewQueue];
                            q[idx]!.category = e.target.value;
                            setReviewQueue(q);
                          }}
                          className="bg-transparent border-none p-0 text-[10px] font-black focus:ring-0 outline-none text-slate-500 dark:text-slate-400"
                        >
                          <option value="Uncategorized">Select Category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div
                          className={`text-[11px] font-black ${t.type === "expense" ? "text-rose-500" : "text-emerald-500"}`}
                        >
                          {t.type === "expense" ? "-" : "+"} ₹
                          {t.amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <button
                          onClick={() =>
                            setReviewQueue(
                              reviewQueue.filter((_, i) => i !== idx),
                            )
                          }
                          className="size-6 flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {reviewQueue.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <ClipboardCheck className="size-12 text-slate-100 dark:text-white/5 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Acquisition channel empty
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
