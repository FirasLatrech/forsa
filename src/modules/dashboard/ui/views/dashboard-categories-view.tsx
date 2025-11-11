"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/Icon";
import { DashboardButton } from "@/components/DashboardButton";
import Field from "@/components/Field";
import Modal from "@/components/Modal";

const DashboardCategoriesView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { data, isLoading } = useQuery({
    ...trpc.admin.categories.getAll.queryOptions({
      page,
      pageSize: 20,
      search: search || undefined,
    }),
  });

  const createMutation = useMutation({
    ...trpc.admin.categories.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "categories", "getAll"]] });
      setIsModalOpen(false);
      setEditingCategory(null);
    },
  });

  const updateMutation = useMutation({
    ...trpc.admin.categories.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "categories", "getAll"]] });
      setIsModalOpen(false);
      setEditingCategory(null);
    },
  });

  const deleteMutation = useMutation({
    ...trpc.admin.categories.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "categories", "getAll"]] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: any = {
      name: formData.get("name") as string,
      nameAr: formData.get("nameAr") as string,
      description: formData.get("description") as string || undefined,
      descriptionAr: formData.get("descriptionAr") as string || undefined,
      image: formData.get("image") as string || undefined,
      isActive: formData.get("isActive") === "on",
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الفئات</h1>
          <p className="text-gray-500 mt-2 text-sm">إدارة فئات المنتجات</p>
        </div>
        <DashboardButton onClick={openCreateModal}>
          <Icon name="Plus" className="w-4 h-4" />
          إضافة فئة جديدة
        </DashboardButton>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Icon
              name="search"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            />
            <input
              type="text"
              placeholder="ابحث عن الفئات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الفئة
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : data?.categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    <Icon name="general" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">لا توجد فئات</p>
                  </td>
                </tr>
              ) : (
                data?.categories.map((category: any) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {category.image && (
                          <img
                            src={category.image}
                            alt={category.nameAr}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {category.nameAr}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {category.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                      <p className="truncate">
                        {category.descriptionAr || category.description || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg ${
                          category.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {category.isActive ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Icon name="pencil" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
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
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6" dir="rtl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="close" className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="الاسم (بالإنجليزية)"
                name="name"
                defaultValue={editingCategory?.name}
                required
                className="text-sm"
              />
              <Field
                label="الاسم (بالعربية)"
                name="nameAr"
                defaultValue={editingCategory?.nameAr}
                required
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="الوصف (بالإنجليزية)"
                name="description"
                defaultValue={editingCategory?.description}
                textarea
                className="text-sm"
              />
              <Field
                label="الوصف (بالعربية)"
                name="descriptionAr"
                defaultValue={editingCategory?.descriptionAr}
                textarea
                className="text-sm"
              />
            </div>

            <div>
              <Field
                label="رابط الصورة"
                name="image"
                defaultValue={editingCategory?.image}
                placeholder="https://example.com/image.jpg"
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingCategory?.isActive ?? true}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">نشط</span>
              </label>
            </div>

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
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editingCategory ? "جاري التحديث..." : "جاري الإضافة..."}
                  </>
                ) : (
                  editingCategory ? "تحديث" : "إضافة"
                )}
              </DashboardButton>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardCategoriesView;
