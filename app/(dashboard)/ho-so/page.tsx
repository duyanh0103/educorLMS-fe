"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMyProfile, useUpdateMyProfile, useChangeMyPassword } from "@/hooks/use-profile";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { ApiRequestError } from "@/types/api";
import type { UserDetail } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useMyProfile();

  if (isLoading) return <p className="text-sm text-muted-foreground">Đang tải...</p>;
  if (isError || !profile) return <p className="text-sm text-destructive">Không tải được hồ sơ.</p>;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Hồ sơ cá nhân</CardTitle>
          <CardDescription className="flex items-center gap-2">
            {profile.username} <Badge variant="outline">{roleLabel(profile.role)}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Component riêng, chỉ mount sau khi profile đã có dữ liệu — để useState lấy giá trị
              ban đầu trực tiếp từ props thay vì phải đồng bộ qua useEffect. */}
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>Sau khi đổi thành công, bạn sẽ được đăng xuất và cần đăng nhập lại.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileForm({ profile }: { profile: UserDetail }) {
  const updateProfile = useUpdateMyProfile();
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateProfile.mutateAsync({
        fullName,
        // Chuỗi rỗng không phải URL/email hợp lệ theo schema backend — bỏ field thay vì gửi ""
        // để giữ nguyên giá trị cũ (PATCH là partial update), không tự ý xoá.
        email: email || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      setUser(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Họ và tên</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setSuccess(false);
          }}
          minLength={2}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSuccess(false);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatarUrl">Ảnh đại diện (URL)</Label>
        <Input
          id="avatarUrl"
          type="url"
          placeholder="https://..."
          value={avatarUrl}
          onChange={(e) => {
            setAvatarUrl(e.target.value);
            setSuccess(false);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Hệ thống chưa hỗ trợ tải ảnh lên — dán đường dẫn ảnh đã có sẵn.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-primary">Đã lưu thay đổi.</p>}
      <Button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </form>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="pr-9"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ChangePasswordForm() {
  const router = useRouter();
  const changePassword = useChangeMyPassword();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [oldPasswordError, setOldPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOldPasswordError(null);
    setNewPasswordError(null);
    setFormError(null);

    if (newPassword !== confirmNewPassword) {
      setFormError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    try {
      await changePassword.mutateAsync({ oldPassword, newPassword });
      // Đổi mật khẩu thành công — buộc đăng nhập lại bằng mật khẩu mới để tránh nhầm lẫn,
      // dù accessToken hiện tại vẫn còn hiệu lực.
      await apiClient("/auth/logout", { method: "POST" }).catch(() => {});
      clearAuth();
      router.push("/login");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        // Sai mật khẩu cũ trả 401 riêng biệt — hiện ngay dưới ô oldPassword theo đúng yêu cầu.
        if (err.status === 401) {
          setOldPasswordError(err.message);
          return;
        }
        // Lỗi validate (độ dài tối thiểu, mật khẩu mới trùng mật khẩu cũ...) có field cụ thể.
        const newPasswordFieldError = err.fieldErrors?.find((fe) => fe.field === "newPassword");
        if (newPasswordFieldError) {
          setNewPasswordError(newPasswordFieldError.message);
          return;
        }
        setFormError(err.message);
      } else {
        setFormError("Đã có lỗi xảy ra, vui lòng thử lại.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
        <PasswordInput
          id="oldPassword"
          value={oldPassword}
          onChange={setOldPassword}
          autoComplete="current-password"
        />
        {oldPasswordError && <p className="text-sm text-destructive">{oldPasswordError}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <PasswordInput
          id="newPassword"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">Tối thiểu 8 ký tự, khác mật khẩu hiện tại.</p>
        {newPasswordError && <p className="text-sm text-destructive">{newPasswordError}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</Label>
        <PasswordInput
          id="confirmNewPassword"
          value={confirmNewPassword}
          onChange={setConfirmNewPassword}
          autoComplete="new-password"
        />
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" disabled={changePassword.isPending}>
        {changePassword.isPending ? "Đang đổi..." : "Đổi mật khẩu"}
      </Button>
    </form>
  );
}

function roleLabel(role: string) {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "TEACHER") return "Giáo viên";
  return "Học sinh";
}
