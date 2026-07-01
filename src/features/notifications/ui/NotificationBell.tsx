"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, MessageSquare, ShoppingBag, Info, CheckCircle2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications } from "../context/NotificationContext";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { motion, AnimatePresence } from "framer-motion";

function formatTimeAgo(dateString: string, t: any) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return t("notifications.time.justNow") || "Ahora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

export function NotificationBell({ align = "right" }: { align?: "left" | "right" }) {
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const { t } = useI18n();
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (id: string, link: string | null) => {
    setIsOpen(false);
    void markNotificationRead(id);
    if (link) {
      router.push(localizePath(link));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "TICKET_MESSAGE":
        return <MessageSquare className="h-4 w-4 text-pink-400" />;
      case "ORDER_STATUS":
        return <ShoppingBag className="h-4 w-4 text-emerald-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border cursor-pointer transition-all duration-300 focus:outline-none hover:bg-white/[0.04]
          ${isOpen ? "border-accent/60 bg-accent/10 text-accent shadow-[0_0_15px_rgba(217,70,239,0.25)]" : "border-white/5 text-white/70 hover:text-white"}`}
        aria-label={t("notifications.bell") || "Notificaciones"}
      >
        <Bell className={`h-4.5 w-4.5 transition-transform duration-300 ${isOpen ? "rotate-12 scale-110" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
        )}
      </button>

      {/* Popover Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`fixed md:absolute top-16 md:top-auto mt-3.5 w-[calc(100vw-2rem)] md:w-[340px] rounded-2xl border border-white/10 bg-[#0c081e]/98 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl z-50 overflow-hidden font-sans
              ${align === "right" 
                ? "left-4 md:left-auto right-4 md:right-0" 
                : "left-4 md:left-0 right-4 md:right-auto"
              }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4.5 py-4 bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {t("notifications.title") || "Notificaciones"}
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-accent/15 border border-accent/20 px-2.5 py-0.5 text-[9px] font-black text-accent uppercase tracking-wider">
                    {unreadCount} {t("notifications.badgeUnread") || "nuevas"}
                  </span>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto divide-y divide-white/[0.03] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="rounded-full bg-white/[0.02] border border-white/5 p-3.5 text-white/20 mb-3.5 shadow-inner">
                    <Bell className="h-6.5 w-6.5" />
                  </div>
                  <p className="text-xs font-bold text-white/85">
                    {t("notifications.emptyTitle") || "Sin notificaciones"}
                  </p>
                  <p className="text-[10px] text-white/40 mt-1.5 max-w-[220px] leading-relaxed">
                    {t("notifications.emptyDesc") || "Te avisaremos cuando haya novedades importantes sobre tus compras o soporte."}
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const isTicket = notification.type === "TICKET_MESSAGE";
                  const isOrder = notification.type === "ORDER_STATUS";
                  
                  // Contextual hover and unread styles (using fade-gradient on the left)
                  const bgAndHoverClass = !notification.read
                    ? isTicket
                      ? "bg-gradient-to-r from-pink-500/10 via-pink-500/[0.02] to-transparent hover:from-pink-500/15"
                      : isOrder
                      ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/[0.02] to-transparent hover:from-emerald-500/15"
                      : "bg-gradient-to-r from-accent/10 via-accent/[0.02] to-transparent hover:from-accent/15"
                    : isTicket
                    ? "bg-transparent hover:bg-gradient-to-r hover:from-pink-500/5 hover:to-transparent"
                    : isOrder
                    ? "bg-transparent hover:bg-gradient-to-r hover:from-emerald-500/5 hover:to-transparent"
                    : "bg-transparent hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent";

                  const iconContainerClass = isTicket 
                    ? "bg-pink-500/10 border-pink-500/20 text-pink-400" 
                    : isOrder 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-accent/10 border-accent/25 text-accent";

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id, notification.link)}
                      className={`flex gap-3 px-4.5 py-4 cursor-pointer transition-all duration-300 relative group ${bgAndHoverClass}`}
                    >
                      {/* Left Icon Container */}
                      <div className="relative shrink-0">
                        <div className={`flex h-8.5 w-8.5 items-center justify-center rounded-full border shadow-sm transition-all group-hover:scale-105 ${iconContainerClass}`}>
                          {getIcon(notification.type)}
                        </div>
                        {!notification.read && (
                          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent border-2 border-[#0c081e] shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2.5">
                          <p className={`text-[11px] leading-tight truncate group-hover:text-accent transition-colors
                            ${!notification.read ? "text-white font-black" : "text-white/60 font-semibold"}`}>
                            {t(notification.title) || notification.title}
                          </p>
                          <span className="text-[9px] text-white/30 shrink-0 mt-0.5 font-medium">
                            {formatTimeAgo(notification.createdAt, t)}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-white/45 group-hover:text-white/60 transition-colors">
                          {(() => {
                            try {
                              const parsed = JSON.parse(notification.content);
                              return t(parsed.key, parsed.params) || notification.content;
                            } catch {
                              return t(notification.content) || notification.content;
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Actions */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between border-t border-white/5 px-4.5 py-3.5 bg-white/[0.01] shrink-0">
                {unreadCount > 0 ? (
                  <button
                    onClick={() => void markAllNotificationsRead()}
                    className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-accent hover:text-white transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("notifications.markAllRead") || "Leer todo"}
                  </button>
                ) : (
                  <div />
                )}
                <button
                  onClick={() => void clearNotifications()}
                  className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("notifications.clearAll") || "Limpiar todo"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
