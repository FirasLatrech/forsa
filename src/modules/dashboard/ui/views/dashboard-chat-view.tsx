"use client";

import { useState, useMemo, useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/Icon";

type FilterType = "all" | "active" | "completed";

const DashboardChatView = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: allData, isLoading } = useQuery({
    ...trpc.chat.adminGetAllMessages.queryOptions({ page: 1, pageSize: 100 }),
  });

  const { data: sessionMessages = [] } = useQuery({
    ...trpc.chat.adminGetSessionMessages.queryOptions({
      sessionId: selectedSessionId || "",
    }),
    enabled: !!selectedSessionId,
    refetchInterval: selectedSessionId ? 3000 : false,
  });

  const { data: unreadData } = useQuery({
    ...trpc.chat.adminGetUnreadCount.queryOptions(),
    refetchInterval: 5000,
  });

  const unreadCount = unreadData?.count || 0;

  const { data: sessionStatus } = useQuery({
    ...trpc.chat.adminGetSessionStatus.queryOptions({
      sessionId: selectedSessionId || "",
    }),
    enabled: !!selectedSessionId,
  });

  const sendReplyMutation = useMutation({
    ...trpc.chat.adminSendReply.mutationOptions(),
    onSuccess: () => {
      setReplyMessage("");
      if (selectedSessionId) {
        queryClient.invalidateQueries({
          queryKey: [["chat", "adminGetSessionMessages"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["chat", "adminGetAllMessages"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["chat", "adminGetUnreadCount"]],
        });
      }
    },
  });

  const markCompletedMutation = useMutation({
    ...trpc.chat.adminMarkSessionCompleted.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["chat", "adminGetSessionStatus"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["chat", "adminGetAllMessages"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["chat", "adminGetUnreadCount"]],
      });
    },
  });

  useEffect(() => {
    if (selectedSessionId && sessionMessages.length > 0) {
      queryClient.invalidateQueries({
        queryKey: [["chat", "adminGetUnreadCount"]],
      });
    }
  }, [selectedSessionId, sessionMessages.length, queryClient]);

  const uniqueSessions = useMemo(() => {
    const sessionsMap = new Map<
      string,
      {
        sessionId: string;
        lastMessage: string;
        lastMessageTime: Date;
        userName: string | null;
        userEmail: string | null;
        ipAddress: string | null;
        isCompleted: boolean;
        hasUnread: boolean;
      }
    >();

    allData?.messages.forEach((msg) => {
      if (!msg.isAdmin && !sessionsMap.has(msg.sessionId)) {
        const status = allData.sessionStatuses?.[msg.sessionId];
        const hasUnread = allData.unreadStatuses?.[msg.sessionId] ?? false;
        sessionsMap.set(msg.sessionId, {
          sessionId: msg.sessionId,
          lastMessage: msg.message,
          lastMessageTime: new Date(msg.createdAt),
          userName: msg.userName,
          userEmail: msg.userEmail,
          ipAddress: msg.ipAddress,
          isCompleted: status?.isCompleted ?? false,
          hasUnread,
        });
      }
    });

    return Array.from(sessionsMap.values()).sort(
      (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );
  }, [allData]);

  const filteredSessions = useMemo(() => {
    if (filter === "all") return uniqueSessions;
    if (filter === "active") return uniqueSessions.filter((s) => !s.isCompleted);
    return uniqueSessions.filter((s) => s.isCompleted);
  }, [uniqueSessions, filter]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedSessionId) return;

    sendReplyMutation.mutate({
      sessionId: selectedSessionId,
      message: replyMessage.trim(),
    });
  };

  const handleToggleCompleted = () => {
    if (!selectedSessionId) return;
    markCompletedMutation.mutate({
      sessionId: selectedSessionId,
      completed: !sessionStatus?.isCompleted,
    });
  };

  const selectedSession = uniqueSessions.find((s) => s.sessionId === selectedSessionId);

  const activeCount = uniqueSessions.filter((s) => !s.isCompleted).length;
  const completedCount = uniqueSessions.filter((s) => s.isCompleted).length;

  return (
    <div className="space-y-6 pb-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المحادثات</h1>
          <p className="text-gray-500 mt-2 text-sm">إدارة محادثات العملاء</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              الكل ({uniqueSessions.length})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "active"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              نشطة ({activeCount})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "completed"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              مكتملة ({completedCount})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                قائمة المحادثات
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {filteredSessions.length} محادثة
              </p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[calc(100vh-250px)] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Icon name="message" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">لا توجد محادثات</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.sessionId}
                    onClick={() => setSelectedSessionId(session.sessionId)}
                    className={`w-full text-right p-4 hover:bg-gray-50 transition-all relative ${
                      selectedSessionId === session.sessionId
                        ? "bg-blue-50 border-r-4 border-blue-600"
                        : ""
                    } ${session.hasUnread ? "bg-blue-50/30" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-semibold text-sm truncate ${
                            session.hasUnread ? "text-gray-900 font-bold" : "text-gray-900"
                          }`}>
                            {session.userName || "مستخدم غير مسجل"}
                          </p>
                          {session.hasUnread && (
                            <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          )}
                          {session.isCompleted && (
                            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Icon name="check" className="w-3 h-3 ml-1" />
                              مكتمل
                            </span>
                          )}
                        </div>
                        {session.userEmail && (
                          <p className="text-xs text-gray-600 truncate">
                            {session.userEmail}
                          </p>
                        )}
                        {session.ipAddress && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            IP: {session.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm line-clamp-2 mb-2 ${
                      session.hasUnread ? "text-gray-900 font-medium" : "text-gray-700"
                    }`}>
                      {session.lastMessage}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        {new Date(session.lastMessageTime).toLocaleString("ar-TN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {session.hasUnread && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          !
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedSessionId ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-250px)] overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {selectedSession?.userName || "مستخدم غير مسجل"}
                    </h3>
                    {selectedSession?.userEmail && (
                      <p className="text-sm text-gray-300">{selectedSession.userEmail}</p>
                    )}
                    {selectedSession?.ipAddress && (
                      <p className="text-xs text-gray-400 mt-1">
                        IP: {selectedSession.ipAddress}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleToggleCompleted}
                    disabled={markCompletedMutation.isPending}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      sessionStatus?.isCompleted
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    <Icon
                      name={sessionStatus?.isCompleted ? "check" : "close"}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">
                      {sessionStatus?.isCompleted ? "مكتمل" : "إكمال المحادثة"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {sessionMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Icon name="message" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">لا توجد رسائل بعد</p>
                  </div>
                ) : (
                  sessionMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          msg.isAdmin
                            ? "bg-white text-gray-900 border border-gray-200"
                            : "bg-gray-900 text-white"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p
                            className={`text-xs ${
                              msg.isAdmin ? "text-gray-400" : "text-gray-300"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString("ar-TN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {msg.isAdmin && (
                            <span className={`text-xs flex items-center gap-1 ${
                              msg.isRead ? "text-green-500" : "text-gray-400"
                            }`}>
                              {msg.isRead ? (
                                <>
                                  <Icon name="check" className="w-3 h-3" />
                                  <span>مقروء</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                  <span>غير مقروء</span>
                                </>
                              )}
                            </span>
                          )}
                          {!msg.isAdmin && (
                            <span className={`text-xs ${
                              msg.isRead ? "text-blue-400" : "text-gray-400"
                            }`}>
                              {msg.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleSendReply}
                className="p-4 border-t border-gray-100 bg-white"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="اكتب ردك..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                    disabled={sendReplyMutation.isPending || sessionStatus?.isCompleted}
                  />
                  <button
                    type="submit"
                    disabled={
                      !replyMessage.trim() ||
                      sendReplyMutation.isPending ||
                      sessionStatus?.isCompleted
                    }
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] flex items-center justify-center"
                  >
                    {sendReplyMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Icon name="arrow" className="w-5 h-5 rotate-180" fill="currentColor" />
                    )}
                  </button>
                </div>
                {sessionStatus?.isCompleted && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    هذه المحادثة مكتملة ولا يمكن إرسال رسائل جديدة
                  </p>
                )}
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center h-[calc(100vh-250px)] flex items-center justify-center">
              <div>
                <Icon name="message" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">اختر محادثة لعرض الرسائل</p>
                <p className="text-sm text-gray-400 mt-2">
                  اختر محادثة من القائمة الجانبية للبدء
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardChatView;
