# CLAUDE.md — EduCore LMS Frontend (educorLMS-fe)

> File này tóm tắt trạng thái dự án để agent tiếp tục làm việc mà không cần đọc lại toàn bộ codebase. Dán/merge nội dung dưới đây vào `CLAUDE.md` hiện có của bạn.

## Tech Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (preset **Maia** — bo góc mềm, spacing rộng)
- **Theme màu**: đỏ-trắng. `--primary: oklch(0.505 0.213 27.325)` (đỏ đậm #B91C1C, dùng cho nút chính/logo/active state). `--destructive` giữ nguyên đỏ sáng mặc định của Maia (#DC2626) — **cố ý khác sắc độ với `--primary`** để phân biệt "hành động chính" vs "hành động nguy hiểm" (xóa). Màu cảnh báo anti-cheat dùng riêng tông **amber**, không dùng đỏ (tránh trùng với brand color).
- **State server**: TanStack Query (React Query)
- **State auth**: Zustand (`store/auth-store.ts`)
- **Font**: Inter (mặc định theo Maia preset)
- **Icon**: 2 thư viện song song có chủ đích — Hugeicons (`@hugeicons/react`) cho UI primitive `components/ui/*` (theo `iconLibrary` trong `components.json`), Lucide (`lucide-react`) cho code tính năng (`app/`, `components/<domain>/*`). Xem thêm mục "Quy ước code khi thêm module mới"
- **Cấu trúc thư mục**: **Ở ROOT, KHÔNG dùng `src/`** — mọi import `@/...` trỏ về root (`@/app`, `@/lib`, `@/store`, `@/types`, `@/components`, `@/hooks`). Thư mục `src/` đã bị xóa hoàn toàn ở giai đoạn đầu do xung đột với `app/` ở root.

## Backend

- Repo riêng: `educorLMS` (Node.js ES Modules + Express 5 + Prisma 6 + PostgreSQL/Neon)
- Base URL: `NEXT_PUBLIC_API_URL` trong `.env.local`
- Response format chuẩn MỌI API: `{success, message, data}` thành công / `{success: false, message, errors: []}` lỗi. Lỗi validate (422) có `errors: [{field, message}]`.
- Auth: JWT access token 15 phút (Bearer header) + refresh token httpOnly cookie 7 ngày. 3 role: `SUPER_ADMIN`, `TEACHER`, `STUDENT`.
- CORS: backend dùng whitelist origin cụ thể + `credentials: true` (đã fix bug "Not allowed by CORS" ở `src/app.js` — nhớ thêm origin mới vào whitelist nếu đổi port/domain FE).

## Kiến trúc FE cốt lõi (đã ổn định từ Bước 1-2, không đổi)

- `lib/api-client.ts`: fetch wrapper tự bóc `data`, tự động gọi `/auth/refresh` khi gặp 401 rồi retry request gốc (gộp nhiều request 401 đồng thời thành 1 lần refresh). Export `apiClient<T>()` và `apiUpload<T>()` (multipart).
- `store/auth-store.ts`: Zustand — `accessToken`, `user`, `isHydrated`, actions `setAuth/setAccessToken/clearAuth/setHydrated`.
- `app/providers.tsx`: bọc `QueryClientProvider` + `AuthHydrator` (tự gọi `/auth/refresh` + `/auth/me` khi load lại trang để giữ đăng nhập qua F5).
- `app/(dashboard)/layout.tsx`: Sidebar (menu theo role, xem `lib/nav-config.ts`) + Header (avatar, tên, đăng xuất) + route guard (chưa đăng nhập → redirect `/login`).
- Pattern chuẩn mọi trang cần `params` động: `params: Promise<{...}>` + `use(params)` (Next.js version hiện tại của project dùng params bất đồng bộ ở Client Component — đã áp dụng nhất quán toàn bộ dự án).
- Pattern lỗi API: luôn `catch (err) { err instanceof ApiRequestError ? err.message : "thông báo mặc định" }` (`types/api.ts`).
- Pattern mutation: dùng TanStack Query `useMutation` + `queryClient.invalidateQueries` để tự refresh danh sách sau khi tạo/sửa/xóa, không tự quản lý state thủ công.

## Quy ước code khi thêm module mới

- **UI primitive mới** (`components/ui/*`): sinh bằng `shadcn` CLI (preset `base-maia`, xem `components.json`), dùng **Base UI** (`@base-ui/react/*`), KHÔNG phải Radix — trigger gắn qua prop `render={element}`, không có `asChild` như Radix. Icon trong các primitive này dùng **Hugeicons** (`@hugeicons/react`) theo `components.json`.
- **Code tính năng** (`app/`, `components/<domain>/*`): icon dùng **lucide-react** — không trộn 2 thư viện icon trong cùng 1 chỗ, giữ đúng ranh giới "primitive dùng Hugeicons / feature code dùng Lucide" đã có sẵn.
- **Dialog/AlertDialog mở trong lúc trang đang ở chế độ Fullscreen API** (vd làm bài thi): `DialogPortal`/`AlertDialogPortal` của Base UI mặc định portal ra `document.body`. Nếu `requestFullscreen()` chỉ gọi trên 1 phần tử con (không phải `document.documentElement`), dialog sẽ render NGOÀI phần tử fullscreen đó → bị ẩn phía sau, xem thêm mục "Lỗi đã gặp". Quy tắc: nếu 1 trang có dùng Dialog/AlertDialog, luôn fullscreen `document.documentElement`; muốn ẩn sidebar/header lúc đó thì ẩn tường minh qua class CSS trên `<body>`, không dựa vào việc giới hạn phạm vi fullscreen.
- **Dialog thêm/sửa dữ liệu gọi mutation**: luôn bọc `await onSubmit(payload)` trong `try/catch`, set state lỗi và hiện ngay trong dialog (giống pattern lỗi API ở trên) — không để lỗi bay lên uncaught, dialog sẽ đứng im không phản hồi mà không rõ lý do.
- **Nút hành động cần khả dụng xuyên suốt 1 flow nhiều bước** (vd nộp bài thi có thể nộp sớm bất kỳ lúc nào): hiện nút đó **thường trực**, không ẩn/thay thế theo điều kiện bước hiện tại (dễ bị hiểu nhầm là nút lỗi/disable).

## Danh sách tính năng ĐÃ HOÀN THÀNH

| # | Tính năng | Route chính | Ghi chú |
|---|---|---|---|
| 1-2 | Setup project, Auth (login/logout/refresh), Layout theo role | `/login`, `(dashboard)/layout.tsx` | |
| 3 | Trang Chủ theo role (Admin/Teacher/Student dashboard) | `/trang-chu` | Dùng `/dashboard/admin`, `/dashboard/teacher`, `/students/me/classes` |
| 4 | Danh sách Lớp Học (SUPER_ADMIN/TEACHER) | `/lop-hoc` | Backend tự lọc theo role, FE không tự filter |
| 5 | Chi tiết Lớp Học + danh sách Bài Thi trong lớp | `/lop-hoc/[classId]` | Đã fix bug Student gọi nhầm `/classes/:id` (Student không có quyền, dùng data từ `/students/me/classes` thay thế) |
| 6 | Học sinh làm bài thi (anti-cheat đầy đủ) | `.../bai-thi/[examId]/lam-bai` | Fullscreen + tab-switch detection, timer đồng bộ server (`startedAt`), `/start` idempotent khi resume sau refresh, chống double-submit |
| 7 | Giáo viên tạo & quản lý đề thi (CRUD câu hỏi + publish) | `.../tao-de-thi`, `.../bai-thi/[examId]` | MC/ESSAY/CODE, khóa sửa câu hỏi khi đã PUBLISHED |
| 8 | Quản lý Người Dùng (tạo/khóa/reset password đơn lẻ) | `/nguoi-dung` | SUPER_ADMIN only, password chỉ hiện 1 lần (dialog không cho click-outside) |
| 9 | Tạo tài khoản hàng loạt từ Excel | `/nguoi-dung/nhap-hang-loat` | Dùng thư viện `xlsx` đọc client-side, gọi `POST /users/bulk` (best-effort), xuất kết quả username+password ra file Excel. Username sinh tự động theo thuật toán: tên riêng (từ cuối) + chữ cái đầu các từ còn lại, vd "Nguyễn Tuấn Anh"→"anhnt" |
| 10 | Ghi danh học sinh vào lớp (Enrollment) | Tab "Học Sinh" trong `/lop-hoc/[classId]` | Best-effort, không cần lọc trước học sinh đã enroll |
| 11 | Quản lý Course/Class CRUD + gán giáo viên | `/khoa-hoc`, nút trong `/lop-hoc` và `/lop-hoc/[classId]` | `PATCH /classes/:id/teachers` là REPLACE toàn bộ danh sách GV, không phải add/remove riêng lẻ. Chỉ SUPER_ADMIN sửa/xóa lớp + gán GV; TEACHER chỉ tạo lớp (tự gán chính mình) |
| 12 | Giáo viên chấm bài tự luận | Tab "Bài nộp" trong trang quản lý đề thi + `.../bai-nop/[submissionId]` | `manualScore` là tổng điểm tự luận (không chấm từng câu), `score = autoScore + manualScore` backend tự tính, chỉ chấm được 1 lần |
| 13 | Hồ sơ cá nhân + Đổi mật khẩu tự đổi | `/ho-so` | Sai mật khẩu cũ trả lỗi riêng gắn vào field `oldPassword` (401), lỗi validate mật khẩu mới (độ dài, trùng mật khẩu cũ...) gắn vào field `newPassword` qua `err.fieldErrors`. Đổi thành công buộc đăng nhập lại bằng mật khẩu mới. Avatar: hệ thống chưa hỗ trợ upload — chỉ dán URL ảnh có sẵn |
| 14 | Import câu hỏi từ file Excel/Word/PDF + ảnh minh hoạ cho câu hỏi/lựa chọn | Nút "Import từ file" trong `.../bai-thi/[examId]` | Ảnh không nhúng được trực tiếp vào cell Excel (thư viện `xlsx` không đọc drawing/embedded image) — phải dán URL ảnh đã upload sẵn (Cloudinary) vào cột `*ImageUrl`. Câu hỏi thủ công đã nâng lên tối đa 6 lựa chọn (A-F, trước đó chỉ 4) + `difficultyLevel`/`skillTag`. Template Excel tải về có đủ 19 cột khớp **CHÍNH XÁC** thứ tự cột `excelParser.js` phía backend: `type, content, contentImageUrl, optionA, optionAImageUrl, ..., optionF, optionFImageUrl, correctAnswer, score, difficultyLevel, skillTag` |
| 15 | Fix anti-cheat lúc làm bài thi: nút Nộp bài + Fullscreen che dialog | `.../bai-thi/[examId]/lam-bai` | 2 bug quan trọng, chi tiết ở mục "Lỗi đã gặp": (1) nút "Nộp bài" trước đây chỉ render ở câu hỏi cuối cùng — đổi thành hiện thường trực ở mọi câu; (2) `requestFullscreen()` đổi từ chỉ khung bài thi sang `document.documentElement` vì Dialog xác nhận nộp bài (portal ra `document.body`) bị fullscreen "che" phía sau, bấm nút tưởng không phản ứng gì. Sidebar/header vẫn ẩn đúng lúc làm bài nhờ class `exam-taking-active` gắn trên `<body>` (độc lập với phạm vi fullscreen) |

## Quy ước đặt tên route (tiếng Việt, không dấu trong URL)

```
/login
/trang-chu
/lop-hoc
/lop-hoc/[classId]
/lop-hoc/[classId]/tao-de-thi
/lop-hoc/[classId]/bai-thi/[examId]                      (quản lý đề — Teacher/Admin)
/lop-hoc/[classId]/bai-thi/[examId]/lam-bai               (làm bài — Student)
/lop-hoc/[classId]/bai-thi/[examId]/bai-nop/[submissionId] (chấm bài — Teacher/Admin)
/lop-hoc/[classId]/yeu-cau-lam-lai                        (yêu cầu làm lại bài thi — Student)
/khoa-hoc
/nguoi-dung
/nguoi-dung/nhap-hang-loat
/ho-so
```

## Đang CHỜ / CHƯA LÀM

- **Assignment (Bài tập thực hành, khác Exam)**: chưa làm gì, có upload file, backend đã sẵn sàng.
- **Playlist/Video bài giảng**: chưa làm.
- **ClassSession (lịch học)**: backend cũng đang làm dở song song, chưa cần FE vội.
- **Các mục sidebar còn lại** (Học Tập, Thực Hành, Thử Thách Hàng Ngày, Thành Tích, Báo Cáo & Thống Kê): **đã loại khỏi phạm vi** theo quyết định ban đầu của user (trừ "Lộ Trình Nghề Nghiệp" đã bỏ hẳn), có thể cần làm skeleton sau nếu user yêu cầu lại.
- **Thiết kế "ấn tượng hơn"**: user từng phản hồi giao diện "quá nhiều màu trắng", có brief thiết kế (`design-brief.md`) đề xuất 3 hướng tăng đỏ chủ đạo — **chưa chốt hướng nào, chưa áp dụng vào code**.

## Lỗi/bài học đã gặp (tránh lặp lại)

- `GET /api/classes/:id` **không có quyền cho STUDENT** — chỉ SUPER_ADMIN/TEACHER phụ trách. Đã fix ở Bước "fix-student-403".
- Có 2 sắc thái đỏ khác nhau cố ý (`--primary` vs `--destructive`) — không tự ý gộp thành 1 màu.
- `PATCH /classes/:id/teachers` là **full replace**, `teachers[].id`/`createdAt` đổi mới mỗi lần gọi (xóa-tạo-lại record) — không dùng các giá trị này để so sánh thay đổi.
- Nhiều API trả **mảng phẳng không phân trang** (vd `/classes/:classId/exams`) trong khi API khác dùng `{items, meta}` — luôn xác nhận response mẫu thật trước khi code, không suy đoán theo pattern chung.
- List endpoint và detail/create endpoint của cùng 1 resource có thể **khác shape** (vd `GET /users` list thiếu `updatedAt`/`deletedAt` so với response tạo/sửa) — dùng type riêng cho list vs detail khi cần.
- **Fullscreen API + Dialog bị "nuốt" click**: `requestFullscreen()` gọi trên 1 `<div>` con (không phải `document.documentElement`) để tránh sidebar/header đè lên — nhưng `Dialog`/`AlertDialog` (Base UI) mặc định portal ra `document.body`, nằm NGOÀI phần tử fullscreen đó nên bị render phía sau nó. Triệu chứng: bấm nút mở dialog (vd "Nộp bài") — state đổi đúng, dialog có mở thật, nhưng vô hình, trông như nút không phản ứng gì. Fix: fullscreen `document.documentElement`; ẩn sidebar/header bằng class CSS trên `<body>` riêng, không dựa vào phạm vi fullscreen để che UI khác.
- **Nút hành động chỉ render có điều kiện dễ bị tưởng là bug**: nút "Nộp bài" trước đây chỉ xuất hiện ở câu hỏi cuối cùng (ternary `currentIndex < length - 1 ? "Câu tiếp" : "Nộp bài"`) — học sinh ở câu giữa bài không thấy nút đâu cả, báo nhầm là "không bấm được nút Nộp bài". Nếu 1 hành động cần dùng được xuyên suốt nhiều bước, hiện thường trực thay vì ẩn/thay theo bước hiện tại.
- **Dialog gọi mutation không bọc `try/catch`**: `QuestionFormDialog` gọi `await onSubmit(payload)` (→ `createQuestion.mutateAsync`) không có `try/catch` — lỗi API (validate, quyền...) bay lên uncaught, dialog không đóng cũng không hiện lỗi gì, trông như nút "Thêm câu hỏi" không hoạt động. Luôn bọc mutation trong dialog bằng `try/catch` + state lỗi hiện ngay trong dialog.
- **Nút submit trong dialog bị `disabled` do validate ẩn, không có gợi ý**: nút "Thêm câu hỏi" (loại Trắc nghiệm) yêu cầu ≥2 lựa chọn có nội dung VÀ đã chọn đáp án đúng mới hết disable — không có bất kỳ hint nào nên nhìn như nút bị lỗi. Khi disable nút vì điều kiện không hiển nhiên, luôn kèm 1 dòng text giải thích còn thiếu gì.