"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { Question, QuestionType, QuestionOption, CreateQuestionPayload } from "@/types/question";

const KEY_LETTERS = ["A", "B", "C", "D", "E", "F"];

interface QuestionFormDialogProps {
  // Base UI Dialog không có "asChild" như Radix — trigger phải là 1 React element để gắn
  // qua prop `render` (không phải children thường).
  trigger: React.ReactElement;
  existingQuestion?: Question;
  nextOrder: number;
  onSubmit: (payload: CreateQuestionPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function QuestionFormDialog({
  trigger,
  existingQuestion,
  nextOrder,
  onSubmit,
  isSubmitting,
}: QuestionFormDialogProps) {
  const isEdit = !!existingQuestion;
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<QuestionType>(existingQuestion?.type ?? "MULTIPLE_CHOICE");
  const [content, setContent] = useState(existingQuestion?.content ?? "");
  const [score, setScore] = useState(existingQuestion?.score ?? 1);
  const [options, setOptions] = useState<QuestionOption[]>(
    existingQuestion?.options ?? [
      { key: "A", text: "" },
      { key: "B", text: "" },
    ]
  );
  const [correctAnswer, setCorrectAnswer] = useState(existingQuestion?.correctAnswer ?? "");

  // Nạp lại dữ liệu form mỗi lần mở dialog (thay vì dùng effect theo dõi `open`) — đây là phản
  // ứng với hành động mở dialog của người dùng, không phải đồng bộ hoá với hệ thống ngoài.
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setType(existingQuestion?.type ?? "MULTIPLE_CHOICE");
      setContent(existingQuestion?.content ?? "");
      setScore(existingQuestion?.score ?? 1);
      setOptions(existingQuestion?.options ?? [{ key: "A", text: "" }, { key: "B", text: "" }]);
      setCorrectAnswer(existingQuestion?.correctAnswer ?? "");
    }
    setOpen(nextOpen);
  }

  function updateOptionText(index: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)));
  }

  function addOption() {
    if (options.length >= KEY_LETTERS.length) return;
    setOptions((prev) => [...prev, { key: KEY_LETTERS[prev.length], text: "" }]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    const removedKey = options[index].key;
    const relettered = options.filter((_, i) => i !== index).map((o, i) => ({ ...o, key: KEY_LETTERS[i] }));
    setOptions(relettered);
    if (correctAnswer === removedKey) setCorrectAnswer("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: CreateQuestionPayload = {
      type,
      content,
      score,
      order: existingQuestion?.order ?? nextOrder,
      ...(type === "MULTIPLE_CHOICE"
        ? { options: options.filter((o) => o.text.trim() !== ""), correctAnswer }
        : {}),
    };
    await onSubmit(payload);
    setOpen(false);
  }

  const isValid =
    content.trim().length > 0 &&
    (type !== "MULTIPLE_CHOICE" ||
      (options.filter((o) => o.text.trim() !== "").length >= 2 && !!correctAnswer));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa câu hỏi" : "Thêm câu hỏi"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Loại câu hỏi</Label>
            <Select value={type} onValueChange={(v) => setType(v as QuestionType)} disabled={isEdit}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MULTIPLE_CHOICE">Trắc nghiệm</SelectItem>
                <SelectItem value="ESSAY">Tự luận</SelectItem>
                <SelectItem value="CODE">Bài tập code</SelectItem>
              </SelectContent>
            </Select>
            {isEdit && <p className="text-xs text-muted-foreground">Không thể đổi loại câu hỏi sau khi đã tạo.</p>}
          </div>

          <div className="space-y-2">
            <Label>Nội dung câu hỏi</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} required />
          </div>

          <div className="space-y-2">
            <Label>Điểm</Label>
            <Input type="number" min={1} value={score} onChange={(e) => setScore(Number(e.target.value))} />
          </div>

          {type === "MULTIPLE_CHOICE" && (
            <div className="space-y-2">
              <Label>Các lựa chọn (chọn đáp án đúng)</Label>
              <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
                {options.map((opt, idx) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.key} id={`opt-${opt.key}`} />
                    <span className="w-5 text-sm text-muted-foreground">{opt.key}.</span>
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOptionText(idx, e.target.value)}
                      placeholder={`Nội dung lựa chọn ${opt.key}`}
                    />
                    {options.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </RadioGroup>
              {options.length < KEY_LETTERS.length && (
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Thêm lựa chọn
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm câu hỏi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
