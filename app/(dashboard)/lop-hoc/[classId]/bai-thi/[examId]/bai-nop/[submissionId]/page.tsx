"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useSubmissionDetail, useGradeSubmission } from "@/hooks/use-submissions-grading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ApiRequestError } from "@/types/api";
import type { SubmissionDetail } from "@/types/grading";
import { cn, formatDateTimeVN } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export default function GradeSubmissionPage({
  params,
}: {
  params: Promise<{ classId: string; examId: string; submissionId: string }>;
}) {
  const { classId, examId, submissionId } = use(params);
  const { data: submission, isLoading, isError } = useSubmissionDetail(submissionId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Đang tải...</p>;
  if (isError || !submission) return <p className="text-sm text-destructive">Không tải được bài nộp.</p>;

  return <GradeSubmissionView classId={classId} examId={examId} submission={submission} />;
}

function GradeSubmissionView({
  classId,
  examId,
  submission,
}: {
  classId: string;
  examId: string;
  submission: SubmissionDetail;
}) {
  const gradeSubmission = useGradeSubmission(submission.id);
  // Component này chỉ mount sau khi submission đã có dữ liệu (xem GradeSubmissionPage) — nên
  // useState lấy giá trị ban đầu trực tiếp từ prop, không cần useEffect đồng bộ.
  const [manualScore, setManualScore] = useState(submission.manualScore ?? 0);
  const [error, setError] = useState<string | null>(null);

  const isGraded = submission.status === "GRADED";
  const essayQuestions = submission.questions.filter((q) => q.type !== "MULTIPLE_CHOICE");
  const maxEssayScore = essayQuestions.reduce((sum, q) => sum + q.score, 0);

  async function handleGrade() {
    setError(null);
    try {
      await gradeSubmission.mutateAsync({ manualScore });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Không thể chấm điểm.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {/* Base UI Button không có "asChild" — dùng buttonVariants() trực tiếp trên <Link>. */}
        <Link
          href={`/lop-hoc/${classId}/bai-thi/${examId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Bài làm của {submission.student.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            Lần nộp {submission.attemptNumber} · Nộp lúc {formatDateTimeVN(submission.submittedAt)}
          </p>
        </div>
        {isGraded ? (
          <Badge className="ml-auto bg-primary/10 text-primary">Đã chấm — {submission.score} điểm</Badge>
        ) : (
          <Badge className="ml-auto bg-amber-100 text-amber-700">Chờ chấm</Badge>
        )}
      </div>

      <div className="space-y-4">
        {submission.questions
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((q, idx) => {
            const studentAnswer = submission.answers[q.id];
            return (
              <Card key={q.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base font-normal">
                    <span>
                      Câu {idx + 1} ({q.score} điểm): {q.content}
                    </span>
                    {q.type === "MULTIPLE_CHOICE" &&
                      (studentAnswer === q.correctAnswer ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                      ))}
                  </CardTitle>
                  {q.contentImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- ảnh Cloudinary tuỳ ý, không cấu hình next/image
                    <img
                      src={q.contentImageUrl}
                      alt=""
                      className="mt-2 max-h-48 rounded-md border object-contain"
                    />
                  )}
                </CardHeader>
                <CardContent>
                  {q.type === "MULTIPLE_CHOICE" && q.options ? (
                    <ul className="space-y-1.5 text-sm">
                      {q.options.map((opt) => {
                        const isStudentChoice = opt.key === studentAnswer;
                        const isCorrect = opt.key === q.correctAnswer;
                        return (
                          <li
                            key={opt.key}
                            className={
                              isCorrect
                                ? "font-medium text-primary"
                                : isStudentChoice
                                  ? "font-medium text-destructive"
                                  : "text-muted-foreground"
                            }
                          >
                            {opt.key}. {opt.text}
                            {isCorrect && " (đáp án đúng)"}
                            {isStudentChoice && !isCorrect && " (học sinh chọn)"}
                            {opt.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element -- ảnh Cloudinary tuỳ ý
                              <img
                                src={opt.imageUrl}
                                alt=""
                                className="mt-1 h-16 rounded border object-contain"
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                      {studentAnswer || <span className="text-muted-foreground italic">Không trả lời</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chấm điểm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Điểm trắc nghiệm (tự động): <strong>{submission.autoScore}</strong>
          </p>

          {essayQuestions.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="manualScore">
                  Điểm tự luận (tổng {essayQuestions.length} câu, tối đa {maxEssayScore} điểm)
                </Label>
                <Input
                  id="manualScore"
                  type="number"
                  min={0}
                  max={maxEssayScore}
                  value={manualScore}
                  onChange={(e) => setManualScore(Number(e.target.value))}
                  className="w-32"
                />
              </div>

              {/* Backend cho phép chấm lại (chỉ chặn khi submission còn IN_PROGRESS) — không disable
                  input/ẩn nút sau khi đã GRADED nữa, để giáo viên sửa được nếu lỡ chấm nhầm. */}
              {isGraded && (
                <p className="text-sm text-muted-foreground">
                  Đã chấm — tổng điểm <strong className="text-primary">{submission.score}</strong> (tự động{" "}
                  {submission.autoScore} + tự luận {submission.manualScore}). Có thể chấm lại nếu cần sửa.
                </p>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button onClick={handleGrade} disabled={gradeSubmission.isPending}>
                {gradeSubmission.isPending ? "Đang lưu..." : isGraded ? "Chấm lại điểm" : "Xác nhận chấm điểm"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Đề không có câu tự luận — điểm đã tự động hoàn tất.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
