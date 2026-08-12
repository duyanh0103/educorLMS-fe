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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUploadImage } from "@/hooks/use-upload";
import { ApiRequestError } from "@/types/api";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import type { Question, QuestionType, QuestionOption, CreateQuestionPayload } from "@/types/question";

const KEY_LETTERS = ["A", "B", "C", "D", "E", "F"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
  const [contentImageUrl, setContentImageUrl] = useState<string | undefined>(existingQuestion?.contentImageUrl);
  const [score, setScore] = useState(existingQuestion?.score ?? 1);
  const [options, setOptions] = useState<QuestionOption[]>(
    existingQuestion?.options ?? [
      { key: "A", text: "" },
      { key: "B", text: "" },
    ]
  );
  const [correctAnswer, setCorrectAnswer] = useState(existingQuestion?.correctAnswer ?? "");
  const [difficultyLevel, setDifficultyLevel] = useState(existingQuestion?.difficultyLevel ?? "");
  const [skillTag, setSkillTag] = useState(existingQuestion?.skillTag ?? "");

  // Nạp lại dữ liệu form mỗi lần mở dialog (thay vì dùng effect theo dõi `open`) — đây là phản
  // ứng với hành động mở dialog của người dùng, không phải đồng bộ hoá với hệ thống ngoài.
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setType(existingQuestion?.type ?? "MULTIPLE_CHOICE");
      setContent(existingQuestion?.content ?? "");
      setContentImageUrl(existingQuestion?.contentImageUrl);
      setScore(existingQuestion?.score ?? 1);
      setOptions(existingQuestion?.options ?? [{ key: "A", text: "" }, { key: "B", text: "" }]);
      setCorrectAnswer(existingQuestion?.correctAnswer ?? "");
      setDifficultyLevel(existingQuestion?.difficultyLevel ?? "");
      setSkillTag(existingQuestion?.skillTag ?? "");
    }
    setOpen(nextOpen);
  }

  function updateOptionText(index: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)));
  }

  function updateOptionImage(index: number, imageUrl: string | undefined) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, imageUrl } : o)));
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
      contentImageUrl,
      score,
      order: existingQuestion?.order ?? nextOrder,
      difficultyLevel: difficultyLevel || undefined,
      skillTag: skillTag || undefined,
      ...(type === "MULTIPLE_CHOICE"
        ? {
            // Lựa chọn tính là "có nội dung" nếu có text HOẶC có ảnh — backend cho phép đáp án
            // chỉ có ảnh không cần text (gửi text: "" khi đó, đã verify qua API thật).
            options: options.filter((o) => o.text.trim() !== "" || o.imageUrl),
            correctAnswer,
          }
        : {}),
    };
    await onSubmit(payload);
    setOpen(false);
  }

  const filledOptionsCount = options.filter((o) => o.text.trim() !== "" || o.imageUrl).length;
  // contentImageUrl chỉ là ảnh minh hoạ thêm — backend vẫn bắt buộc content tối thiểu 3 ký tự
  // dù có ảnh hay không (khác với option, cho phép chỉ có ảnh không cần text).
  const isValid =
    content.trim().length >= 3 &&
    (type !== "MULTIPLE_CHOICE" || (filledOptionsCount >= 2 && !!correctAnswer));

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
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} minLength={3} required />
            <ImageUploadField
              value={contentImageUrl}
              onChange={setContentImageUrl}
              label="Thêm ảnh minh hoạ"
            />
          </div>

          <div className="space-y-2">
            <Label>Điểm</Label>
            <Input type="number" min={1} value={score} onChange={(e) => setScore(Number(e.target.value))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Mức độ (không bắt buộc)</Label>
              <Input
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                placeholder="VD: NB, TH, VD, VDC"
              />
            </div>
            <div className="space-y-2">
              <Label>Kỹ năng (không bắt buộc)</Label>
              <Input
                value={skillTag}
                onChange={(e) => setSkillTag(e.target.value)}
                placeholder="VD: Tư duy máy tính"
              />
            </div>
          </div>

          {type === "MULTIPLE_CHOICE" && (
            <div className="space-y-2">
              <Label>Các lựa chọn (chọn đáp án đúng)</Label>
              <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
                {options.map((opt, idx) => (
                  <div key={opt.key} className="flex items-start gap-2 py-1">
                    <RadioGroupItem value={opt.key} id={`opt-${opt.key}`} className="mt-2.5" />
                    <span className="mt-2.5 w-5 text-sm text-muted-foreground">{opt.key}.</span>
                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={opt.text}
                        onChange={(e) => updateOptionText(idx, e.target.value)}
                        placeholder={`Nội dung lựa chọn ${opt.key} (có thể để trống nếu chỉ dùng ảnh)`}
                      />
                      <ImageUploadField
                        value={opt.imageUrl}
                        onChange={(url) => updateOptionImage(idx, url)}
                        label="Thêm ảnh"
                        compact
                      />
                    </div>
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

function ImageUploadField({
  value,
  onChange,
  label,
  compact,
}: {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
  label: string;
  compact?: boolean;
}) {
  const uploadImage = useUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Ảnh vượt quá 5MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    try {
      const result = await uploadImage.mutateAsync(file);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Upload ảnh thất bại.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      {value ? (
        <div className="flex items-center gap-1.5 rounded-md border bg-muted/40 p-1 pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh Cloudinary tuỳ ý, không thuộc domain cố định để cấu hình next/image */}
          <img
            src={value}
            alt=""
            className={compact ? "h-8 w-8 rounded object-cover" : "h-14 w-14 rounded object-cover"}
          />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size={compact ? "xs" : "sm"}
          onClick={() => inputRef.current?.click()}
          disabled={uploadImage.isPending}
        >
          <ImagePlus className="mr-1 h-3.5 w-3.5" /> {uploadImage.isPending ? "Đang tải..." : label}
        </Button>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
