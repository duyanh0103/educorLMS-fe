"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useImportQuestions } from "@/hooks/use-questions";
import { downloadQuestionTemplate } from "@/lib/excel-questions";
import { ApiRequestError } from "@/types/api";
import type { ImportQuestionsResponse } from "@/types/import-question";
import { AlertTriangle, Download, Upload } from "lucide-react";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/pdf",
];

interface ImportQuestionsDialogProps {
  examId: string;
  trigger: React.ReactElement;
}

export function ImportQuestionsDialog({ examId, trigger }: ImportQuestionsDialogProps) {
  const [open, setOpen] = useState(false);
  const importQuestions = useImportQuestions(examId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportQuestionsResponse | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setError(null);
      setResult(null);
    }
    setOpen(nextOpen);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Chỉ chấp nhận file .xlsx, .docx, hoặc .pdf.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("File vượt quá 10MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const data = await importQuestions.mutateAsync(file);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Import thất bại, vui lòng thử lại.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import câu hỏi từ file</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Chấp nhận file <strong>.xlsx</strong>, <strong>.docx</strong>, hoặc <strong>.pdf</strong> đúng
            template, tối đa 10MB.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadQuestionTemplate}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Tải file mẫu Excel
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.docx,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={importQuestions.isPending}>
            <Upload className="mr-1.5 h-4 w-4" /> {importQuestions.isPending ? "Đang import..." : "Chọn file"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {result && (
            <div className="space-y-3">
              <p className="text-sm">
                Đã import thành công <strong className="text-primary">{result.importedCount}</strong> câu hỏi.
              </p>
              {result.skipped.length > 0 && (
                <div className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
                    <AlertTriangle className="h-4 w-4" /> {result.skipped.length} câu bị bỏ qua
                  </p>
                  <ul className="space-y-1 text-sm text-amber-700">
                    {result.skipped.map((s, idx) => (
                      <li key={idx}>
                        {s.row !== null ? `Dòng ${s.row}: ` : ""}
                        {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
