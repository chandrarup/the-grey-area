"use client";

import { useRef, useSyncExternalStore } from "react";

/**
 * The student's own photo for their seat and video tile. Kept on this device
 * only (localStorage), resized small; never uploaded to the server.
 */

const KEY = "stage:photo";
const EVENT = "stage-photo-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useStudentPhoto() {
  return useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(KEY),
    () => null,
  );
}

function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 480;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = Math.round(size * 0.5625);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function PhotoButton({ photo }: { photo: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex items-center gap-1.5 underline-offset-4 hover:underline"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-4 w-4 rounded-full object-cover" />
        ) : null}
        {photo ? "Change photo" : "Add your photo"}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const data = await resize(file);
          window.localStorage.setItem(KEY, data);
          window.dispatchEvent(new Event(EVENT));
          e.target.value = "";
        }}
      />
    </>
  );
}
