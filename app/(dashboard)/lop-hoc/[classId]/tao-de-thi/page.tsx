"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateExam } from "@/hooks/use-exam-mutations";
import { ApiRequestError } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function CreateExamPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const router = useRouter();
  const createExam = useCreateExam(classId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const exam = await createExam.mutateAsync({
        title,
        description: description || undefined,
        durationMinutes,
      });
      router.push(`/lop-hoc/${classId}/bai-thi/${exam.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Đã có lỗi xảy ra.");
    }
  }

  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Tạo đề thi mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tên đề thi</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả (không bắt buộc)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Thời gian làm bài (phút)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={createExam.isPending}>
              {createExam.isPending ? "Đang tạo..." : "Tạo đề thi (ở trạng thái Nháp)"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
