"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useBulkCreateUsers } from "@/hooks/use-bulk-create-users";
import {
  parseUsersExcel,
  downloadUserTemplate,
  downloadCreatedUsersResult,
  type ParsedUserRow,
} from "@/lib/excel-users";
import { ApiRequestError } from "@/types/api";
import type { BulkImportResponse } from "@/types/bulk-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Download, Upload, AlertTriangle, ArrowLeft } from "lucide-react";

type ViewState = "idle" | "preview" | "result";
const MAX_ROWS = 200;

export default function BulkImportUsersPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const isAuthorized = currentUser?.role === "SUPER_ADMIN";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkCreate = useBulkCreateUsers();

  const [view, setView] = useState<ViewState>("idle");
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasExported, setHasExported] = useState(false);

  // Điều hướng là side effect — không gọi router.replace() trực tiếp trong thân render.
  useEffect(() => {
    if (currentUser && !isAuthorized) {
      router.replace("/trang-chu");
    }
  }, [currentUser, isAuthorized, router]);

  useEffect(() => {
    if (view !== "result" || hasExported) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [view, hasExported]);

  if (!currentUser || !isAuthorized) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    try {
      const rows = await parseUsersExcel(file);
      if (rows.length === 0) {
        setParseError("File không có dữ liệu.");
        return;
      }
      if (rows.length > MAX_ROWS) {
        setParseError(`File có ${rows.length} dòng, vượt quá giới hạn ${MAX_ROWS} dòng/lần. Vui lòng chia nhỏ file.`);
        return;
      }
      setParsedRows(rows);
      setView("preview");
    } catch {
      setParseError("Không đọc được file. Đảm bảo đúng định dạng .xlsx theo template.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const needsReviewCount = parsedRows.filter((r) => r.fullName.length < 2 || !r.roleNormalized).length;

  async function handleSubmit() {
    setSubmitError(null);
    try {
      const data = await bulkCreate.mutateAsync(
        parsedRows.map((r) => ({
          fullName: r.fullName,
          role: r.roleNormalized ?? r.roleRaw,
          email: r.email ?? undefined,
        }))
      );
      setResult(data);
      setHasExported(false);
      setView("result");
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Đã có lỗi xảy ra, thử lại sau.");
    }
  }

  function handleExport() {
    if (!result) return;
    downloadCreatedUsersResult(result.created);
    setHasExported(true);
  }

  function handleBackToList() {
    // beforeunload chỉ chặn được điều hướng cấp trình duyệt (đổi URL, back, đóng tab) — nút này
    // là chuyển trang nội bộ Next.js (client-side routing), không kích hoạt beforeunload, nên cần
    // tự xác nhận riêng để giữ đúng nguyên tắc "chưa xuất file thì chưa cho rời trang".
    if (!hasExported && result && result.createdCount > 0) {
      if (!window.confirm("Bạn chưa xuất file mật khẩu. Rời trang bây giờ sẽ mất vĩnh viễn các mật khẩu vừa tạo. Vẫn rời đi?")) {
        return;
      }
    }
    router.push("/nguoi-dung");
  }

  function handleReset() {
    setView("idle");
    setParsedRows([]);
    setResult(null);
    setParseError(null);
    setSubmitError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {/* Base UI Button không có "asChild" như Radix — dùng buttonVariants() trực tiếp trên
            <Link>, đúng pattern đã dùng nhất quán từ Bước 4 (ExamCard, ...). */}
        <Link
          href="/nguoi-dung"
          onClick={(e) => {
            if (view !== "result" || hasExported || !result || result.createdCount === 0) return;
            e.preventDefault();
            handleBackToList();
          }}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Tạo tài khoản hàng loạt từ Excel</h1>
      </div>

      {view === "idle" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bước 1: Tải template &amp; điền dữ liệu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              File Excel cần 3 cột: <strong>Họ và Tên</strong>, <strong>Vai trò</strong> (ghi &quot;Học sinh&quot;
              hoặc &quot;Giáo viên&quot;), <strong>Email</strong> (không bắt buộc). Tối đa {MAX_ROWS} dòng/lần.
            </p>
            <Button variant="outline" onClick={downloadUserTemplate}>
              <Download className="mr-1.5 h-4 w-4" /> Tải file template mẫu
            </Button>

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Bước 2: Tải file đã điền lên</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-upload"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" /> Chọn file Excel
              </Button>
              {parseError && <p className="text-sm text-destructive">{parseError}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {view === "preview" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="text-sm">
                Đọc được <strong>{parsedRows.length}</strong> dòng
                {needsReviewCount > 0 && (
                  <>
                    {" "}
                    — <span className="text-amber-700">{needsReviewCount} dòng nên kiểm tra lại</span> (vẫn sẽ gửi
                    lên, backend sẽ tự báo lỗi cụ thể nếu có)
                  </>
                )}
                .
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Chọn file khác
              </Button>
            </CardContent>
          </Card>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Dòng</TableHead>
                <TableHead>Họ và Tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedRows.map((r) => {
                const needsReview = r.fullName.length < 2 || !r.roleNormalized;
                return (
                  <TableRow key={r.row} className={needsReview ? "bg-amber-50" : undefined}>
                    <TableCell>{r.row}</TableCell>
                    <TableCell>
                      {r.fullName || <span className="text-muted-foreground italic">trống</span>}
                    </TableCell>
                    <TableCell>
                      {r.roleNormalized ? (
                        r.roleNormalized === "TEACHER" ? (
                          "Giáo viên"
                        ) : (
                          "Học sinh"
                        )
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" /> &quot;{r.roleRaw || "trống"}&quot;
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.email ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Button onClick={handleSubmit} disabled={bulkCreate.isPending} size="lg">
            {bulkCreate.isPending ? "Đang tạo..." : `Gửi ${parsedRows.length} dòng lên hệ thống`}
          </Button>
        </div>
      )}

      {view === "result" && result && (
        <div className="space-y-6">
          <Card className={!hasExported ? "border-amber-300 bg-amber-50" : undefined}>
            <CardContent className="space-y-3 py-4">
              <p className="text-sm">
                Đã tạo thành công <strong className="text-primary">{result.createdCount}</strong> tài khoản
                {result.skippedCount > 0 && (
                  <>
                    , bỏ qua <strong className="text-destructive">{result.skippedCount}</strong> dòng
                  </>
                )}
                .
              </p>
              {!hasExported && result.createdCount > 0 && (
                <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
                  <AlertTriangle className="h-4 w-4" /> Tải file kết quả NGAY — mật khẩu sẽ không thể xem lại sau khi
                  rời trang này.
                </p>
              )}
              {result.createdCount > 0 && (
                <Button onClick={handleExport}>
                  <Download className="mr-1.5 h-4 w-4" /> Xuất file Excel (username + mật khẩu)
                </Button>
              )}
            </CardContent>
          </Card>

          {result.created.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Tài khoản đã tạo</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Họ và Tên</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Mật khẩu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.created.map((c) => (
                    <TableRow key={c.row}>
                      <TableCell className="font-medium">{c.user.username}</TableCell>
                      <TableCell>{c.user.fullName}</TableCell>
                      <TableCell>{c.user.role === "TEACHER" ? "Giáo viên" : "Học sinh"}</TableCell>
                      <TableCell className="font-mono text-sm">{c.initialPassword}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {result.skipped.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Dòng bị bỏ qua</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Dòng</TableHead>
                    <TableHead>Họ và Tên</TableHead>
                    <TableHead>Lý do</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.skipped.map((s) => (
                    <TableRow key={s.row}>
                      <TableCell>{s.row}</TableCell>
                      <TableCell>{s.fullName ?? "—"}</TableCell>
                      <TableCell className="text-sm text-destructive">{s.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Button variant="outline" onClick={handleBackToList}>
            Quay lại danh sách người dùng
          </Button>
        </div>
      )}
    </div>
  );
}
