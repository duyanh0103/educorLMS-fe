"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useExamDetail } from "@/hooks/use-exam-detail";
import {
  useMySubmission,
  useStartSubmission,
  useSubmissionDetail,
  useSubmitSubmission,
} from "@/hooks/use-submission";
import { useCreateRetakeRequest, useMyRetakeRequest } from "@/hooks/use-retake-request";
import { ApiRequestError } from "@/types/api";
import type { StartSubmissionResponse, SubmitSubmissionResponse } from "@/types/submission";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ShieldAlert, Clock } from "lucide-react";

type ViewState = "intro" | "blocked" | "taking" | "result";

const MAX_VIOLATIONS = 3;

export default function TakeExamPage({
  params,
}: {
  params: Promise<{ classId: string; examId: string }>;
}) {
  const { classId, examId } = use(params);
  const router = useRouter();

  const { data: exam, isLoading: loadingExam, isError: errorExam } = useExamDetail(examId);
  const startMutation = useStartSubmission(examId);
  const submitMutation = useSubmitSubmission(examId);
  const mySubmissionMutation = useMySubmission(examId);
  const submissionDetailMutation = useSubmissionDetail();

  const [view, setView] = useState<ViewState>("intro");
  const [blockedMessage, setBlockedMessage] = useState("");
  const [submission, setSubmission] = useState<StartSubmissionResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationDialog, setShowViolationDialog] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitSubmissionResponse | null>(null);
  const [showRetakeForm, setShowRetakeForm] = useState(false);
  const [retakeReason, setRetakeReason] = useState("");

  const {
    data: myRetakeRequest,
    isLoading: loadingRetakeRequest,
  } = useMyRetakeRequest(examId, result?.id ?? "", view === "result" && !!result);
  const createRetakeRequest = useCreateRetakeRequest(examId, result?.id ?? "");

  const lastViolationAt = useRef(0);
  const hasFinished = useRef(false); // true khi đã nộp (thủ công hoặc tự động) — chặn double-submit
  const answersRef = useRef<Record<string, string>>({});
  const violationCountRef = useRef(0);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  async function requestFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Không hỗ trợ/bị chặn — vẫn cho làm bài, chỉ là không ép được fullscreen
    }
  }

  async function handleStart() {
    if (!exam) return;
    try {
      const data = await startMutation.mutateAsync();
      const remaining = data.durationMinutes * 60 - computeElapsedSeconds(data.startedAt);

      if (remaining <= 0) {
        // Phiên làm bài (resume từ /start idempotent) đã hết giờ thật trước khi vào —
        // backend chắc chắn từ chối /submit nên chặn sớm, không cho vào giao diện làm bài.
        setBlockedMessage(
          "Phiên làm bài này đã hết giờ. Vui lòng liên hệ giáo viên để được mở lại nếu cần làm tiếp."
        );
        setView("blocked");
        return;
      }

      setSubmission(data);
      setRemainingSeconds(remaining);
      setView("taking");
      await requestFullscreen();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        // Đã nộp bài rồi (kể cả ở phiên trước, sau khi rời trang quay lại) — lấy submission thật
        // qua /submissions/mine + /submissions/:id để hiện lại màn kết quả, thay vì chỉ hiện
        // thông báo chung chung "không thể vào làm bài".
        const recovered = await tryRecoverResult();
        if (recovered) return;
      }
      setBlockedMessage(err instanceof ApiRequestError ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.");
      setView("blocked");
    }
  }

  async function tryRecoverResult(): Promise<boolean> {
    if (!exam) return false;
    try {
      const mine = await mySubmissionMutation.mutateAsync();
      const detail = await submissionDetailMutation.mutateAsync(mine.id);
      setSubmission({
        id: detail.id,
        attemptNumber: detail.attemptNumber,
        startedAt: detail.startedAt,
        durationMinutes: exam.durationMinutes,
        questions: detail.questions,
      });
      setResult(detail);
      hasFinished.current = true;
      setView("result");
      return true;
    } catch {
      return false;
    }
  }

  const doSubmit = useCallback(async () => {
    if (hasFinished.current) return;
    hasFinished.current = true;
    setSubmitError(null);
    try {
      const data = await submitMutation.mutateAsync(answersRef.current);
      setResult(data);
      setView("result");
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    } catch (err) {
      hasFinished.current = false; // cho phép thử nộp lại nếu lỗi mạng, không mất answers
      // Không dùng alert() — dialog gốc trình duyệt cũng tự ép thoát fullscreen giống confirm(),
      // gây tính nhầm vi phạm y hệt bug đã gặp ở nút Nộp bài.
      setSubmitError(err instanceof ApiRequestError ? err.message : "Nộp bài thất bại, vui lòng thử lại.");
    }
  }, [submitMutation]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (view !== "taking") return;
    if (remainingSeconds <= 0) {
      doSubmit();
      return;
    }
    const timer = setTimeout(() => setRemainingSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [view, remainingSeconds, doSubmit]);

  // Phát hiện vi phạm: rời tab / thoát fullscreen.
  // Quyết định (mở dialog hay tự nộp bài) xử lý ngay trong handler thay vì effect theo dõi
  // violationCount, vì đây là phản ứng với sự kiện chứ không phải state cần đồng bộ.
  const registerViolation = useCallback(() => {
    // Đã nộp bài (thủ công/tự động/hết giờ) — bỏ qua sự kiện xảy ra sau đó, kể cả
    // fullscreenchange do chính lệnh exitFullscreen() trong doSubmit gây ra.
    if (hasFinished.current) return;
    const now = Date.now();
    if (now - lastViolationAt.current < 1000) return; // gộp sự kiện trùng lặp trong 1 giây
    lastViolationAt.current = now;

    const next = violationCountRef.current + 1;
    violationCountRef.current = next;
    setViolationCount(next);

    if (next >= MAX_VIOLATIONS) {
      doSubmit();
    } else {
      setShowViolationDialog(true);
    }
  }, [doSubmit]);

  useEffect(() => {
    if (view !== "taking") return;
    function onVisibilityChange() {
      if (document.hidden) registerViolation();
    }
    function onFullscreenChange() {
      if (!document.fullscreenElement) registerViolation();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [view, registerViolation]);

  // Cảnh báo khi rời/đóng trang giữa chừng
  useEffect(() => {
    if (view !== "taking") return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [view]);

  function handleAnswerChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleReenterFullscreen() {
    setShowViolationDialog(false);
    await requestFullscreen();
  }

  function handleManualSubmit() {
    setShowSubmitConfirm(true);
  }

  function handleConfirmSubmit() {
    setShowSubmitConfirm(false);
    doSubmit();
  }

  async function handleSendRetakeRequest() {
    await createRetakeRequest.mutateAsync(retakeReason);
    setShowRetakeForm(false);
    setRetakeReason("");
  }

  function handleStartRetake() {
    // Đã được duyệt làm lại — quay về màn hình giới thiệu, gọi lại /start sẽ tạo attempt mới
    hasFinished.current = false;
    setResult(null);
    setSubmission(null);
    setAnswers({});
    setCurrentIndex(0);
    setViolationCount(0);
    violationCountRef.current = 0;
    setShowRetakeForm(false);
    setRetakeReason("");
    setView("intro");
  }

  // ----- Render -----
  if (loadingExam) {
    return <p className="text-sm text-muted-foreground">Đang tải...</p>;
  }
  if (errorExam || !exam) {
    return <p className="text-sm text-destructive">Không tải được thông tin đề thi.</p>;
  }

  if (view === "intro") {
    return (
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <ShieldAlert className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">{exam.title}</CardTitle>
            {exam.description && <CardDescription>{exam.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="divide-y rounded-lg border">
              {exam._count && (
                <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Số câu hỏi</span>
                  <span className="font-semibold">{exam._count.questions}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Thời gian</span>
                <span className="font-semibold">{exam.durationMinutes} phút</span>
              </div>
            </div>

            <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <ShieldAlert className="h-4 w-4" /> Quy tắc chống gian lận:
              </p>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-amber-700">
                <li>Bài thi sẽ vào chế độ toàn màn hình</li>
                <li>Hệ thống theo dõi việc chuyển tab/cửa sổ</li>
                <li>Cảnh báo 2 lần, vi phạm lần 3 sẽ tự động nộp bài</li>
                <li>Chỉ những câu đã trả lời mới được chấm điểm</li>
              </ul>
            </div>

            <Button className="w-full" size="lg" onClick={handleStart} disabled={startMutation.isPending}>
              {startMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu làm bài (Toàn màn hình)"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "blocked") {
    return (
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Không thể vào làm bài</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{blockedMessage}</p>
            <Button variant="outline" onClick={() => router.push(`/lop-hoc/${classId}`)}>
              Quay lại lớp học
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "result" && result) {
    const isGraded = result.status === "GRADED";
    // Điểm đạt = tối thiểu một nửa tổng điểm tối đa của đề (đề không có thang điểm cố định
    // như 10, nên lấy mốc giữa tổng điểm các câu làm "điểm trung bình" để xét Đạt/Chưa đạt).
    const totalPossibleScore = submission?.questions.reduce((sum, q) => sum + q.score, 0) ?? 0;
    const passThreshold = totalPossibleScore / 2;
    const isFailing = isGraded && totalPossibleScore > 0 && (result.score ?? 0) < passThreshold;
    // Chỉ PENDING/APPROVED mới chặn gửi yêu cầu mới (khớp logic backend) — REJECTED vẫn cho gửi lại.
    const canRequestRetake =
      !loadingRetakeRequest && (!myRetakeRequest || myRetakeRequest.status === "REJECTED");

    return (
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Đã nộp bài thành công</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGraded ? (
              <div className="space-y-1.5">
                <p className={cn("text-3xl font-bold", isFailing ? "text-destructive" : "text-primary")}>
                  {result.score} điểm
                </p>
                {isFailing && <Badge variant="destructive">Chưa đạt</Badge>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bài có câu tự luận — chờ giáo viên chấm điểm.</p>
            )}

            {/* Luôn có một trạng thái hiển thị ở đây (loading/pending/approved/rejected/nút mời gửi yêu cầu) —
                không để khoảng trống trong lúc chờ API trả lời trạng thái yêu cầu làm lại. */}
            {loadingRetakeRequest && (
              <p className="text-sm text-muted-foreground">Đang kiểm tra trạng thái yêu cầu làm lại...</p>
            )}

            {!loadingRetakeRequest && myRetakeRequest?.status === "PENDING" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Yêu cầu làm lại đang chờ giáo viên duyệt.
              </p>
            )}

            {!loadingRetakeRequest && myRetakeRequest?.status === "APPROVED" && (
              <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-sm text-primary">Giáo viên đã duyệt yêu cầu — bạn có thể làm lại bài.</p>
                <Button className="w-full" onClick={handleStartRetake}>
                  Làm lại bài thi
                </Button>
              </div>
            )}

            {!loadingRetakeRequest && myRetakeRequest?.status === "REJECTED" && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Yêu cầu làm lại trước đó đã bị từ chối
                {myRetakeRequest.reviewNote ? `: ${myRetakeRequest.reviewNote}` : "."}
              </p>
            )}

            {canRequestRetake && !showRetakeForm && (
              <Button variant="outline" className="w-full" onClick={() => setShowRetakeForm(true)}>
                Yêu cầu làm lại
              </Button>
            )}

            {canRequestRetake && showRetakeForm && (
              <div className="space-y-2 text-left">
                <Textarea
                  rows={3}
                  placeholder="Lý do xin làm lại (không bắt buộc)..."
                  value={retakeReason}
                  onChange={(e) => setRetakeReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowRetakeForm(false)}
                    disabled={createRetakeRequest.isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSendRetakeRequest}
                    disabled={createRetakeRequest.isPending}
                  >
                    {createRetakeRequest.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
                  </Button>
                </div>
                {createRetakeRequest.isError && (
                  <p className="text-sm text-destructive">
                    {createRetakeRequest.error instanceof ApiRequestError
                      ? createRetakeRequest.error.message
                      : "Gửi yêu cầu thất bại, vui lòng thử lại."}
                  </p>
                )}
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={() => router.push(`/lop-hoc/${classId}`)}>
              Quay lại lớp học
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!submission) return null;
  const question = submission.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 py-2 backdrop-blur">
        <div className="text-sm text-muted-foreground">
          Câu {currentIndex + 1}/{submission.questions.length} · Đã trả lời {answeredCount}/
          {submission.questions.length}
        </div>
        <div className="flex items-center gap-2 font-mono text-lg font-semibold">
          <Clock className="h-4 w-4" />
          {formatTime(remainingSeconds)}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal">
            Câu {currentIndex + 1}: {question.content}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {question.type === "MULTIPLE_CHOICE" && question.options ? (
            <RadioGroup
              value={answers[question.id] ?? ""}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              {question.options.map((opt) => (
                <div key={opt.key} className="flex items-center space-x-2 py-1.5">
                  <RadioGroupItem value={opt.key} id={`${question.id}-${opt.key}`} />
                  <Label htmlFor={`${question.id}-${opt.key}`} className="cursor-pointer font-normal">
                    {opt.key}. {opt.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              rows={8}
              placeholder="Nhập câu trả lời..."
              value={answers[question.id] ?? ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      {submitError && <p className="text-center text-sm text-destructive">{submitError}</p>}

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>
          Câu trước
        </Button>

        <div className="flex flex-wrap justify-center gap-1">
          {submission.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-8 w-8 rounded border text-xs font-medium ${
                idx === currentIndex
                  ? "border-primary bg-primary text-primary-foreground"
                  : answers[q.id]
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentIndex < submission.questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex((i) => i + 1)}>Câu tiếp</Button>
        ) : (
          <Button onClick={handleManualSubmit} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
          </Button>
        )}
      </div>

      <AlertDialog open={showViolationDialog} onOpenChange={setShowViolationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
              <ShieldAlert className="h-5 w-5" /> Cảnh báo vi phạm ({violationCount}/{MAX_VIOLATIONS})
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hệ thống phát hiện bạn đã rời khỏi màn hình làm bài. Vi phạm lần thứ {MAX_VIOLATIONS} bài thi sẽ tự
              động được nộp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleReenterFullscreen}>Quay lại làm bài</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nộp bài thi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đã trả lời {answeredCount}/{submission.questions.length} câu. Sau khi nộp sẽ không thể sửa lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>Nộp bài</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function computeElapsedSeconds(startedAt: string) {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
}
