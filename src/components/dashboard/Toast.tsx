"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info } from "@/components/ui/icons";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  fadingOut?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const MAX_TOASTS = 3;
const DISMISS_MS = 3000;
const FADE_MS = 300;

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const startFadeOut = useCallback(
    (id: string) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, fadingOut: true } : t)),
      );
      const fadeTimer = setTimeout(() => removeToast(id), FADE_MS);
      timersRef.current.set(id + "_fade", fadeTimer);
    },
    [removeToast],
  );

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `toast_${++idCounter}`;
      const newToast: Toast = { id, message, type };

      setToasts((prev) => {
        const next = [...prev, newToast];
        // Remove oldest if exceeding max
        while (next.length > MAX_TOASTS) {
          const oldest = next.shift()!;
          const timer = timersRef.current.get(oldest.id);
          if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(oldest.id);
          }
        }
        return next;
      });

      const dismissTimer = setTimeout(() => startFadeOut(id), DISMISS_MS);
      timersRef.current.set(id, dismissTimer);
    },
    [startFadeOut],
  );

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const iconMap: Record<ToastType, { Icon: typeof CheckCircle2; color: string }> = {
    success: { Icon: CheckCircle2, color: "text-emerald-400" },
    error: { Icon: AlertCircle, color: "text-red-400" },
    info: { Icon: Info, color: "text-blue-400" },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => {
              const { Icon, color } = iconMap[t.type];
              return (
                <div
                  key={t.id}
                  className="pointer-events-auto"
                  style={{
                    animation: t.fadingOut
                      ? `toastSlideOut ${FADE_MS}ms ease-in forwards`
                      : `toastSlideIn ${FADE_MS}ms ease-out forwards`,
                  }}
                >
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#16161f] border border-white/[0.08] shadow-lg max-w-xs">
                    <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                    <span className="text-xs font-mono text-white/90 leading-tight">
                      {t.message}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
      {mounted &&
        createPortal(
          <style>{`
            @keyframes toastSlideIn {
              from { opacity: 0; transform: translateX(100%); }
              to   { opacity: 1; transform: translateX(0); }
            }
            @keyframes toastSlideOut {
              from { opacity: 1; transform: translateX(0); }
              to   { opacity: 0; transform: translateX(100%); }
            }
          `}</style>,
          document.head,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
