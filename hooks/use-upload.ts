import { useMutation } from "@tanstack/react-query";
import { apiUpload } from "@/lib/api-client";

interface UploadImageResponse {
  url: string;
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiUpload<UploadImageResponse>("/uploads/image", formData);
    },
  });
}
