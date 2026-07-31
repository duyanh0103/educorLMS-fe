"use client";

import { use, useState } from "react";
import { useExamDetail } from "@/hooks/use-exam-detail";
import { useQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion } from "@/hooks/use-questions";
import { useUpdateExam } from "@/hooks/use-exam-mutations";
import { QuestionFormDialog } from "@/components/exam/question-form-dialog";
import { ExamStatusBadge } from "@/components/exam/exam-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/types/api";
import { Pencil, Trash2, Plus, CheckCircle2 } from "lucide-react";
import type { Question, CreateQuestionPayload } from "@/types/question";

export default function ManageExamPage({
  params,
}: {
  params: Promise<{ classId: string; examId: string }>;
}) {
  const { examId } = use(params);

  const { data: exam, isLoading: loadingExam, isError: errorExam } = useExamDetail(examId);
  const { data: questions, isLoading: loadingQuestions } = useQuestions(examId);
  const createQuestion = useCreateQuestion(examId);
  const updateExam = useUpdateExam(examId);
  const deleteQuestion = useDeleteQuestion(examId);

  const [publishError, setPublishError] = useState<string | null>(null);

  if (loadingExam) return <p className="text-sm text-muted-foreground">Đang tải...</p>;
  if (errorExam || !exam) return <p className="text-sm text-destructive">Không tải được thông tin đề thi.</p>;

  const isDraft = exam.status === "DRAFT";
  const nextOrder = (questions?.length ?? 0) + 1;

  async function handleCreateQuestion(payload: CreateQuestionPayload) {
    await createQuestion.mutateAsync(payload);
  }

  async function handleDelete(questionId: string) {
    if (!window.confirm("Xóa câu hỏi này? Không thể hoàn tác.")) return;
    await deleteQuestion.mutateAsync(questionId);
  }

  async function handlePublish() {
    if (!window.confirm("Sau khi xuất bản sẽ không thể thêm/sửa/xóa câu hỏi nữa. Xác nhận xuất bản?")) return;
    setPublishError(null);
    try {
      await updateExam.mutateAsync({ status: "PUBLISHED" });
    } catch (err) {
      setPublishError(err instanceof ApiRequestError ? err.message : "Không thể xuất bản đề thi.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <ExamStatusBadge status={exam.status} />
          </div>
          {exam.description && <p className="mt-1 text-sm text-muted-foreground">{exam.description}</p>}
          <p className="mt-1 text-sm text-muted-foreground">
            {exam.durationMinutes} phút · {questions?.length ?? 0} câu hỏi
          </p>
        </div>
        {isDraft && (
          <Button onClick={handlePublish} disabled={updateExam.isPending || (questions?.length ?? 0) === 0}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            {updateExam.isPending ? "Đang xuất bản..." : "Xuất bản đề thi"}
          </Button>
        )}
      </div>

      {publishError && <p className="text-sm text-destructive">{publishError}</p>}
      {!isDraft && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Đề thi đã xuất bản — không thể thêm/sửa/xóa câu hỏi nữa.
        </p>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Câu hỏi</h2>
        {isDraft && (
          <QuestionFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" /> Thêm câu hỏi
              </Button>
            }
            nextOrder={nextOrder}
            onSubmit={handleCreateQuestion}
            isSubmitting={createQuestion.isPending}
          />
        )}
      </div>

      {loadingQuestions && <p className="text-sm text-muted-foreground">Đang tải câu hỏi...</p>}
      {questions && questions.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có câu hỏi nào.</p>
      )}

      <div className="space-y-3">
        {questions
          ?.slice()
          .sort((a, b) => a.order - b.order)
          .map((q, idx) => (
            <QuestionRow
              key={q.id}
              question={q}
              index={idx}
              examId={examId}
              isDraft={isDraft}
              onDelete={() => handleDelete(q.id)}
            />
          ))}
      </div>
    </div>
  );
}

function QuestionRow({
  question,
  index,
  examId,
  isDraft,
  onDelete,
}: {
  question: Question;
  index: number;
  examId: string;
  isDraft: boolean;
  onDelete: () => void;
}) {
  const updateQuestion = useUpdateQuestion(examId, question.id);

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">
            Câu {index + 1} ({typeLabel(question.type)} · {question.score} điểm): {question.content}
          </p>
          {isDraft && (
            <div className="flex shrink-0 gap-1">
              <QuestionFormDialog
                trigger={
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
                existingQuestion={question}
                nextOrder={question.order}
                onSubmit={async (payload) => {
                  await updateQuestion.mutateAsync(payload);
                }}
                isSubmitting={updateQuestion.isPending}
              />
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>

        {question.type === "MULTIPLE_CHOICE" && question.options && (
          <ul className="space-y-0.5 pl-4 text-sm text-muted-foreground">
            {question.options.map((opt) => (
              <li key={opt.key} className={opt.key === question.correctAnswer ? "font-medium text-primary" : ""}>
                {opt.key}. {opt.text} {opt.key === question.correctAnswer && "✓"}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function typeLabel(type: Question["type"]) {
  if (type === "MULTIPLE_CHOICE") return "Trắc nghiệm";
  if (type === "ESSAY") return "Tự luận";
  return "Code";
}
