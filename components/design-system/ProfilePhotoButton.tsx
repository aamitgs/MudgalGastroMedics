"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { notify } from "@/lib/notify";

const maxPhotoSizeBytes = 2 * 1024 * 1024;

/**
 * Self-service profile photo upload, shared between TopNav (Hospital OS
 * shell) and StaffChrome (Doctor Portal shell) so the upload/validation
 * logic lives in exactly one place instead of two copies drifting apart.
 */
export function ProfilePhotoButton({
  hasPhoto,
  onPhotoUpdated,
  avatarClassName
}: {
  hasPhoto: boolean;
  onPhotoUpdated: () => void;
  avatarClassName?: string;
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);

  async function uploadPhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      notify.error("Only JPEG, PNG, or WEBP photos are accepted.");
      return;
    }
    if (file.size > maxPhotoSizeBytes) {
      notify.error("Photo must be under 2MB.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    let response: Response;
    try {
      response = await fetch("/api/account/photo", { method: "POST", body: formData });
    } catch {
      setUploading(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void uploadPhoto(file));
      return;
    }
    const data = await response.json().catch(() => ({}));
    setUploading(false);
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to upload photo.");
      return;
    }
    setPhotoVersion((value) => value + 1);
    onPhotoUpdated();
    notify.success("Profile photo updated");
  }

  return (
    <>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={hasPhoto ? "Change profile photo" : "Upload profile photo"}
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void uploadPhoto(file);
        }}
      />
      <button
        type="button"
        onClick={() => photoInputRef.current?.click()}
        disabled={uploading}
        className="rounded-full transition hover:opacity-80 disabled:cursor-wait disabled:opacity-60"
        aria-label={hasPhoto ? "Change profile photo" : "Upload profile photo"}
        title={hasPhoto ? "Change profile photo" : "Upload profile photo"}
      >
        <Avatar className={avatarClassName ?? "h-10 w-10 border border-line"}>
          {hasPhoto ? <AvatarImage src={`/api/account/photo?v=${photoVersion}`} alt="" className="object-cover" /> : null}
          <AvatarFallback className="bg-white p-1.5">
            <img src="/mgm-icon.png" alt="" className="h-full w-full object-contain" />
          </AvatarFallback>
        </Avatar>
      </button>
    </>
  );
}
