"use client";

import { useState, useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/Icon";

const getSessionId = (): string => {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem("chat_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("chat_session_id", sessionId);
  }
  return sessionId;
};

const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = num1 + num2;
  return { question: `${num1} + ${num2}`, answer };
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [sessionId] = useState(() => getSessionId());
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMarkedAsReadRef = useRef<string>("");

  const { data: messages = [] } = useQuery({
    ...trpc.chat.getMessages.queryOptions({ sessionId }),
    enabled: isOpen,
    refetchInterval: isOpen ? 3000 : false,
  });

  const { data: unreadData } = useQuery({
    ...trpc.chat.getUnreadCount.queryOptions(),
    refetchInterval: 5000,
  });

  const hasUserMessages = messages.some((msg) => !msg.isAdmin);
  const unreadCount = unreadData?.count || 0;
  const hasUnreadMessages = messages.some((msg) => !msg.isAdmin && !msg.isRead);
  const messagesKey = messages.map((m) => `${m.id}-${m.isRead}`).join(",");

  const markAsReadMutation = useMutation({
    ...trpc.chat.markAsRead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["chat", "getUnreadCount"]],
      });
    },
  });

  const sendMessageMutation = useMutation({
    ...trpc.chat.sendMessage.mutationOptions(),
    onSuccess: () => {
      setMessage("");
      setCaptchaAnswer("");
      setShowCaptcha(false);
      setCaptcha(generateCaptcha());
      queryClient.invalidateQueries({
        queryKey: [["chat", "getMessages"], { input: { sessionId } }],
      });
      queryClient.invalidateQueries({
        queryKey: [["chat", "getUnreadCount"]],
      });
      inputRef.current?.focus();
    },
  });

  useEffect(() => {
    if (isOpen && hasUnreadMessages && hasMarkedAsReadRef.current !== messagesKey) {
      hasMarkedAsReadRef.current = messagesKey;
      markAsReadMutation.mutate({ sessionId });
    }
  }, [isOpen, hasUnreadMessages, messagesKey, sessionId]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const isFirstMessage = !hasUserMessages;

    if (isFirstMessage && !showCaptcha) {
      setShowCaptcha(true);
      return;
    }

    if (showCaptcha && parseInt(captchaAnswer) !== captcha.answer) {
      setCaptchaAnswer("");
      setCaptcha(generateCaptcha());
      return;
    }

    sendMessageMutation.mutate({
      sessionId,
      message: message.trim(),
    });
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-4 bottom-4 sm:left-6 sm:bottom-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center hover:scale-105"
          aria-label="فتح المحادثة"
        >
          <Icon name="message" className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed left-4 bottom-4 sm:left-6 sm:bottom-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-2rem)] sm:h-[600px] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100" dir="rtl">
          <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-gray-900 rounded-t-2xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <h3 className="text-sm sm:text-base font-semibold text-white">المحادثة</h3>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setShowCaptcha(false);
                setCaptchaAnswer("");
              }}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="إغلاق"
            >
              <Icon name="close" className="w-4 h-4 text-gray-300" fill="currentColor" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 space-y-2 sm:space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-6 sm:mt-8">
                <p className="text-xs sm:text-sm">مرحبا! كيف يمكنني مساعدتك؟</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 ${
                      msg.isAdmin
                        ? "bg-white text-gray-900 border border-gray-200 shadow-sm"
                        : "bg-gray-900 text-white"
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed break-words">{msg.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className={`text-[10px] sm:text-xs ${msg.isAdmin ? "text-gray-400" : "text-gray-300"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("ar-TN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {!msg.isAdmin && (
                        <span className={`flex items-center ${msg.isRead ? "text-blue-300" : "text-gray-400"}`}>
                          {msg.isRead ? (
                            <Icon name="check-circle" className="w-3 h-3" fill="currentColor" />
                          ) : (
                            <Icon name="check" className="w-3 h-3" fill="currentColor" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {showCaptcha && (
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-yellow-50 border-t border-yellow-200">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex-1">
                  <label className="text-[10px] sm:text-xs font-medium text-gray-700 block mb-1 sm:mb-1.5">
                    حل هذا السؤال: {captcha.question} = ?
                  </label>
                  <input
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="الإجابة"
                    className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    style={{ fontFamily: "var(--font-cairo), sans-serif" }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setShowCaptcha(false);
                    setCaptchaAnswer("");
                    setCaptcha(generateCaptcha());
                  }}
                  className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 self-end sm:self-auto"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="px-3 py-3 sm:px-4 sm:py-4 bg-white border-t border-gray-200">
            <div className="flex gap-1.5 sm:gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالتك..."
                className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                style={{ fontFamily: "var(--font-cairo), sans-serif" }}
                disabled={sendMessageMutation.isPending}
              />
              <button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] sm:min-w-[48px] flex items-center justify-center"
              >
                {sendMessageMutation.isPending ? (
                  <span className="text-xs sm:text-sm">...</span>
                ) : (
                  <Icon name="arrow" className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" fill="currentColor" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
