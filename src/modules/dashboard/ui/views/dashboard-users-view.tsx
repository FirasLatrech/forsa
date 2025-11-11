"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/Icon";
import { DashboardButton } from "@/components/DashboardButton";
import Field from "@/components/Field";
import Modal from "@/components/Modal";

const DashboardUsersView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data, isLoading } = useQuery(
    trpc.admin.users.getAll.queryOptions({
      page,
      pageSize: 20,
      search: search || undefined,
    })
  );

  const updateMutation = useMutation({
    mutationFn: (input: any) => fetch('/api/trpc/admin.users.update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'users', 'getAll']] });
      setIsModalOpen(false);
      setEditingUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch('/api/trpc/admin.users.delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { id } }),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'users', 'getAll']] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateMutation.mutate({
      id: editingUser.id,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      isAdmin: formData.get("isAdmin") === "on",
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("تأكد باش تحب تحذف هذا المستخدم؟")) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ar-TN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المستخدمين</h1>
          <p className="text-gray-600 mt-1">إدارة حسابات المستخدمين</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Icon
              name="Search"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            />
            <input
              type="text"
              placeholder="دور على المستخدمين..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  البريد الإلكتروني
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ التسجيل
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    قاعد يتحمل...
                  </td>
                </tr>
              ) : data?.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    ماكش مستخدمين
                  </td>
                </tr>
              ) : (
                data?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Icon name="User" className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.isAdmin
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.isAdmin ? "مدير" : "مستخدم عادي"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-left space-x-2 space-x-reverse">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-800 inline-block"
                      >
                        <Icon name="Edit" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800 inline-block"
                      >
                        <Icon name="Trash" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(page + 1)}
              disabled={!data.pagination.hasNextPage}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
            <span className="text-sm text-gray-700">
              صفحة {page} من {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page - 1)}
              disabled={!data.pagination.hasPreviousPage}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6" dir="rtl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            بدل المستخدم
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="الاسم"
              name="name"
              defaultValue={editingUser?.name}
              required
            />
            <Field
              label="البريد الإلكتروني"
              name="email"
              type="email"
              defaultValue={editingUser?.email}
              required
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isAdmin"
                defaultChecked={editingUser?.isAdmin ?? false}
                className="rounded"
              />
              <span className="text-sm text-gray-700">مدير</span>
            </label>

            <div className="flex justify-end gap-3 mt-6">
              <DashboardButton
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                ألغي
              </DashboardButton>
              <DashboardButton
                type="submit"
                disabled={updateMutation.isPending}
              >
                بدل
              </DashboardButton>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardUsersView;
