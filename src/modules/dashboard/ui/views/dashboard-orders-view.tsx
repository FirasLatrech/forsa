"use client";

import { useState, useMemo } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/Icon";
import { DashboardButton } from "@/components/DashboardButton";
import Field from "@/components/Field";
import Modal from "@/components/Modal";

type ViewMode = "list" | "board";

const DashboardOrdersView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending" | "processing" | "shipped" | "delivered" | "cancelled" | "">("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data, isLoading } = useQuery({
    ...trpc.admin.orders.getAll.queryOptions({
      page,
      pageSize: 100,
      search: search || undefined,
      status: (statusFilter || undefined) as "pending" | "processing" | "shipped" | "delivered" | "cancelled" | undefined,
    }),
  });

  const updateStatusMutation = useMutation({
    ...trpc.admin.orders.updateStatus.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "orders", "getAll"]] });
      setIsModalOpen(false);
      setSelectedOrder(null);
    },
  });

  const queryKey = useMemo(
    () =>
      trpc.admin.orders.getAll.queryOptions({
        page,
        pageSize: 100,
        search: search || undefined,
        status: (statusFilter || undefined) as "pending" | "processing" | "shipped" | "delivered" | "cancelled" | undefined,
      }).queryKey,
    [trpc, page, search, statusFilter]
  );

  const dragStatusMutation = useMutation({
    ...trpc.admin.orders.updateStatus.mutationOptions(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          orders: old.orders.map((order: any) =>
            order.id === variables.id
              ? { ...order, status: variables.status, updatedAt: new Date() }
              : order
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSettled: () => {
      setDraggedOrder(null);
      setDragOverColumn(null);
    },
  });

  const updateOrderMutation = useMutation({
    ...trpc.admin.orders.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "orders", "getAll"]] });
      setIsEditModalOpen(false);
      setSelectedOrder(null);
    },
  });

  const rejectOrderMutation = useMutation({
    ...trpc.admin.orders.updateStatus.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "orders", "getAll"]] });
    },
  });

  const deleteMutation = useMutation({
    ...trpc.admin.orders.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "orders", "getAll"]] });
    },
  });

  const handleStatusUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateStatusMutation.mutate({
      id: selectedOrder.id,
      status: formData.get("status") as "pending" | "processing" | "shipped" | "delivered" | "cancelled",
      trackingNumber: formData.get("trackingNumber") as string || undefined,
    });
  };

  const handleEditOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateOrderMutation.mutate({
      id: selectedOrder.id,
      shippingName: formData.get("shippingName") as string,
      shippingPhone: formData.get("shippingPhone") as string,
      shippingAddress: formData.get("shippingAddress") as string,
      shippingCity: formData.get("shippingCity") as string,
      notes: formData.get("notes") as string || undefined,
      paymentMethod: formData.get("paymentMethod") as string || undefined,
    });
  };

  const handleReject = (orderId: string) => {
    if (confirm("هل أنت متأكد من رفض هذا الطلب؟")) {
      rejectOrderMutation.mutate({
        id: orderId,
        status: "cancelled",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const openOrderModal = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const openEditModal = (order: any) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      processing: "bg-blue-50 text-blue-700 border-blue-200",
      shipped: "bg-purple-50 text-purple-700 border-purple-200",
      delivered: "bg-green-50 text-green-700 border-green-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status as keyof typeof colors] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "في الانتظار",
      processing: "قيد المعالجة",
      shipped: "تم الشحن",
      delivered: "تم التسليم",
      cancelled: "ملغي",
    };
    return statusMap[status] || status;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ar-TN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColumns = [
    { id: "pending", title: "في الانتظار", orders: data?.orders.filter((o: any) => o.status === "pending") || [] },
    { id: "processing", title: "قيد المعالجة", orders: data?.orders.filter((o: any) => o.status === "processing") || [] },
    { id: "shipped", title: "تم الشحن", orders: data?.orders.filter((o: any) => o.status === "shipped") || [] },
    { id: "delivered", title: "تم التسليم", orders: data?.orders.filter((o: any) => o.status === "delivered") || [] },
    { id: "cancelled", title: "ملغي", orders: data?.orders.filter((o: any) => o.status === "cancelled") || [] },
  ];

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrder(orderId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", orderId);
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
    setDragOverColumn(null);
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");
    
    if (orderId && draggedOrder) {
      const order = data?.orders.find((o: any) => o.id === orderId);
      if (order && order.status !== targetStatus) {
        setDraggedOrder(null);
        setDragOverColumn(null);
        
        dragStatusMutation.mutate({
          id: orderId,
          status: targetStatus as "pending" | "processing" | "shipped" | "delivered" | "cancelled",
        });
      } else {
        setDraggedOrder(null);
        setDragOverColumn(null);
      }
    } else {
      setDraggedOrder(null);
      setDragOverColumn(null);
    }
  };

  return (
    <div className="space-y-6 pb-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الطلبات</h1>
          <p className="text-gray-500 mt-2 text-sm">إدارة طلبات الزبائن</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="general" className="w-4 h-4" />
                قائمة
              </div>
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "board"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="general" className="w-4 h-4" />
                لوحة
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Icon
                name="search"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                type="text"
                placeholder="ابحث عن الطلبات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "")}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">الكل</option>
              <option value="pending">في الانتظار</option>
              <option value="processing">قيد المعالجة</option>
              <option value="shipped">تم الشحن</option>
              <option value="delivered">تم التسليم</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>

        {viewMode === "list" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      رقم الطلب
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      الزبون
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                      </td>
                    </tr>
                  ) : data?.orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <Icon name="general" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">لا توجد طلبات</p>
                      </td>
                    </tr>
                  ) : (
                    data?.orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 text-sm">
                            #{order.orderNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {order.shippingName}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {order.shippingPhone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {order.total} د.ت
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openOrderModal(order)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تغيير الحالة"
                            >
                              <Icon name="pencil" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(order)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Icon name="pencil" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(order.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="رفض"
                            >
                              <Icon name="close" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Icon name="trash" className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {data && data.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.pagination.hasNextPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  التالي
                </button>
                <span className="text-sm text-gray-600">
                  صفحة {page} من {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!data.pagination.hasPreviousPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  السابق
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-3 overflow-x-auto pb-2">
                {statusColumns.map((column) => (
                  <div
                    key={column.id}
                    className="min-w-[220px] flex flex-col"
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    <div className={`mb-3 p-2.5 rounded-lg border-2 transition-all ${getStatusColor(column.id)} ${
                      dragOverColumn === column.id ? "ring-2 ring-blue-500 ring-offset-1 scale-[1.02]" : ""
                    }`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xs">{column.title}</h3>
                        <span className="text-xs font-bold opacity-80 bg-white/50 px-1.5 py-0.5 rounded-full">
                          {column.orders.length}
                        </span>
                      </div>
                    </div>
                    <div className={`flex-1 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto min-h-[120px] transition-all duration-200 ${
                      dragOverColumn === column.id ? "bg-blue-50/40 rounded-lg p-1.5" : ""
                    }`}>
                      {column.orders.map((order: any) => (
                        <div
                          key={order.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, order.id)}
                          onDragEnd={handleDragEnd}
                          className={`group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-gray-300 transition-all duration-200 ${
                            draggedOrder === order.id 
                              ? "opacity-30 scale-90 rotate-2 shadow-xl z-50" 
                              : isDragging 
                              ? "opacity-60" 
                              : "hover:scale-[1.02]"
                          }`}
                          style={{ cursor: isDragging || draggedOrder === order.id ? "grabbing" : "grab" }}
                          onClick={() => {
                            if (!isDragging && !draggedOrder) {
                              openOrderModal(order);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-bold text-xs text-gray-900">
                              #{order.orderNumber}
                            </div>
                            <div className="text-xs font-semibold text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded">
                              {order.total} د.ت
                            </div>
                          </div>
                          <div className="space-y-1 mb-2">
                            <p className="text-xs text-gray-700 truncate">
                              {order.shippingName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.shippingPhone}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-[10px] text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString("ar-TN", { month: "short", day: "numeric" })}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(order);
                                }}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="تعديل"
                              >
                                <Icon name="pencil" className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(order.id);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="حذف"
                              >
                                <Icon name="trash" className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {column.orders.length === 0 && (
                        <div className={`text-center py-12 text-xs transition-all duration-200 ${
                          dragOverColumn === column.id 
                            ? "text-blue-600 font-semibold bg-blue-50/50 rounded-lg py-8 border-2 border-dashed border-blue-300" 
                            : "text-gray-400"
                        }`}>
                          {dragOverColumn === column.id ? (
                            <div className="space-y-1">
                              <div className="text-lg">↓</div>
                              <div>افلت الطلب هنا</div>
                            </div>
                          ) : (
                            "لا توجد طلبات"
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6" dir="rtl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">تغيير حالة الطلب</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="close" className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {selectedOrder && (
            <div className="mb-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">رقم الطلب:</span>
                  <span className="text-sm text-gray-900">#{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">الزبون:</span>
                  <span className="text-sm text-gray-900">{selectedOrder.shippingName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">الهاتف:</span>
                  <span className="text-sm text-gray-900">{selectedOrder.shippingPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">المبلغ:</span>
                  <span className="text-sm text-gray-900">{selectedOrder.total} د.ت</span>
                </div>
              </div>

              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحالة
                  </label>
                  <select
                    name="status"
                    defaultValue={selectedOrder.status}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  >
                    <option value="pending">في الانتظار</option>
                    <option value="processing">قيد المعالجة</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="delivered">تم التسليم</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>

                <Field
                  label="رقم التتبع"
                  name="trackingNumber"
                  defaultValue={selectedOrder.trackingNumber || ""}
                  placeholder="أدخل رقم التتبع"
                  className="text-sm"
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <DashboardButton
                    type="button"
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    إلغاء
                  </DashboardButton>
                  <DashboardButton
                    type="submit"
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري التحديث...
                      </>
                    ) : (
                      "تحديث الحالة"
                    )}
                  </DashboardButton>
                </div>
              </form>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="p-6" dir="rtl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">تعديل الطلب</h2>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="close" className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {selectedOrder && (
            <form onSubmit={handleEditOrder} className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">رقم الطلب:</span>
                  <span className="text-sm text-gray-900 font-bold">#{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">المبلغ:</span>
                  <span className="text-sm text-gray-900 font-bold">{selectedOrder.total} د.ت</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="اسم المستلم"
                  name="shippingName"
                  defaultValue={selectedOrder.shippingName}
                  required
                  className="text-sm"
                />
                <Field
                  label="رقم الهاتف"
                  name="shippingPhone"
                  type="tel"
                  defaultValue={selectedOrder.shippingPhone}
                  required
                  className="text-sm"
                />
              </div>

              <Field
                label="العنوان"
                name="shippingAddress"
                defaultValue={selectedOrder.shippingAddress}
                required
                className="text-sm"
              />

              <Field
                label="المدينة"
                name="shippingCity"
                defaultValue={selectedOrder.shippingCity}
                required
                className="text-sm"
              />

              <Field
                label="ملاحظات"
                name="notes"
                defaultValue={selectedOrder.notes || ""}
                textarea
                className="text-sm"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  طريقة الدفع
                </label>
                <select
                  name="paymentMethod"
                  defaultValue={selectedOrder.paymentMethod || "cash"}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="cash">الدفع عند الاستلام</option>
                  <option value="card">بطاقة الدفع</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <DashboardButton
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  إلغاء
                </DashboardButton>
                <DashboardButton
                  type="submit"
                  disabled={updateOrderMutation.isPending}
                >
                  {updateOrderMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري التحديث...
                    </>
                  ) : (
                    "تحديث الطلب"
                  )}
                </DashboardButton>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DashboardOrdersView;
