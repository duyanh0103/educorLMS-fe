"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateUser } from "@/hooks/use-users";
import { PasswordRevealDialog } from "./password-reveal-dialog";
import { ApiRequestError } from "@/types/api";
import { Plus } from "lucide-react";

type CreatableRole = "TEACHER" | "STUDENT";

export function CreateUserDialog() {
  const createUser = useCreateUser();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreatableRole>("STUDENT");
  const [error, setError] = useState<string | null>(null);

  const [revealOpen, setRevealOpen] = useState(false);
  const [revealData, setRevealData] = useState<{ username: string; password: string } | null>(null);

  function resetForm() {
    setUsername("");
    setFullName("");
    setEmail("");
    setRole("STUDENT");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await createUser.mutateAsync({
        username,
        fullName,
        email: email || undefined,
        role,
      });
      setRevealData({ username: result.user.username, password: result.initialPassword });
      setRevealOpen(true);
      setOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Đã có lỗi xảy ra.");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {/* Base UI Dialog không có "asChild" như Radix — gắn trigger tuỳ ý qua prop `render`. */}
        <DialogTrigger
          render={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> Tạo tài khoản
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo tài khoản Giáo viên/Học sinh</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={30}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                minLength={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (không bắt buộc)</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select value={role} onValueChange={(v) => setRole(v as CreatableRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Học sinh</SelectItem>
                  <SelectItem value="TEACHER">Giáo viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {revealData && (
        <PasswordRevealDialog
          open={revealOpen}
          onOpenChange={setRevealOpen}
          username={revealData.username}
          password={revealData.password}
        />
      )}
    </>
  );
}
