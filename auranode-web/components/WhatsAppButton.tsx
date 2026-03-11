"use client";

import { MessageCircle } from "lucide-react";
import { generateWhatsAppLink } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  phone: string;
  reportToken: string;
  className?: string;
}

export function WhatsAppButton({ phone, reportToken, className }: Props) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const handleClick = () => {
    const link = generateWhatsAppLink(phone, reportToken, appUrl);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      title="Opens WhatsApp Web with pre-filled message"
      aria-label="Send report link to patient via WhatsApp"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors",
        className
      )}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      Send to Patient
    </button>
  );
}
