"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, AlertTriangle } from "lucide-react";

interface PasswordRevealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  password: string;
}

export function PasswordRevealDialog({ open, onOpenChange, username, password }: PasswordRevealDialogProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Base UI Dialog không có prop "onInteractOutside" như Radix. Chặn mọi lần Base UI tự đóng dialog
  // (click ra ngoài, phím Esc...) bằng cách bỏ qua nextOpen === false đến từ đây — chỉ nút "Tôi đã
  // sao chép, đóng" ở footer mới thực sự đóng được (nó gọi thẳng onOpenChange(false) từ ngoài, không
  // qua đường này). Mật khẩu chỉ hiển thị đúng 1 lần nên bắt buộc phải chặn đóng ngoài ý muốn.
  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      {/* Ẩn nút X góc trên — nó cũng sẽ bị chặn bởi handleDialogOpenChange, để lộ ra sẽ giống 1
          nút chết không phản hồi. Chỉ còn đúng 1 cách đóng: nút xác nhận ở footer. */}
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" /> Mật khẩu chỉ hiển thị 1 lần
          </DialogTitle>
          <DialogDescription>
            Sao chép và gửi cho <strong>{username}</strong> ngay bây giờ — hệ thống sẽ không thể hiển thị lại mật
            khẩu này sau khi đóng cửa sổ.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input value={password} readOnly className="font-mono" />
          <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tôi đã sao chép, đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
