"use client";

import { MessageCircle } from "lucide-react";
import { generateWhatsAppLink } from "@/lib/utils";

interface Props {
  phone: string;
  reportToken: string;
  className?: string;
}

export function WhatsAppButton({ phone, reportToken, className = "" }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const handleClick = () => {
    const link = generateWhatsAppLink(phone, reportToken, appUrl);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Opens WhatsApp Web with pre-filled message"
      className={`inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      Send to Patient
    </button>
  );
}
