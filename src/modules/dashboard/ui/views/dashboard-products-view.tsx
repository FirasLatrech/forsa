"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/Icon";
import { DashboardButton } from "@/components/DashboardButton";
import Field from "@/components/Field";
import Modal from "@/components/Modal";

const DashboardProductsView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const { data, isLoading } = useQuery({
    ...trpc.admin.products.getAll.queryOptions({
      page,
      pageSize: 20,
      search: search || undefined,
    }),
  });

  const { data: categories } = useQuery({
    ...trpc.categories.getAll.queryOptions(),
  });

  const createMutation = useMutation({
    ...trpc.admin.products.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "products", "getAll"]] });
      setIsModalOpen(false);
      setEditingProduct(null);
    },
  });

  const updateMutation = useMutation({
    ...trpc.admin.products.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "products", "getAll"]] });
      setIsModalOpen(false);
      setEditingProduct(null);
    },
  });

  const deleteMutation = useMutation({
    ...trpc.admin.products.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "products", "getAll"]] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const images = formData.get("images") as string;
    const data: any = {
      name: formData.get("name") as string,
      nameAr: formData.get("nameAr") as string,
      description: formData.get("description") as string || undefined,
      descriptionAr: formData.get("descriptionAr") as string || undefined,
      amount: formData.get("amount") as string,
      categoryId: formData.get("categoryId") as string,
      images: images ? images.split(",").map((img) => img.trim()).filter(Boolean) : [],
      sku: formData.get("sku") as string,
      stock: Number(formData.get("stock")),
      isActive: formData.get("isActive") === "on",
      isFeatured: formData.get("isFeatured") === "on",
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct({
      ...product,
      amount: product.price,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المنتجات</h1>
          <p className="text-gray-500 mt-2 text-sm">إدارة مخزون المنتجات</p>
        </div>
        <DashboardButton onClick={openCreateModal}>
          <Icon name="Plus" className="w-4 h-4" />
          إضافة منتج جديد
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
              placeholder="ابحث عن المنتجات..."
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
                  المنتج
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  رمز المنتج
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  السعر
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  المخزون
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : data?.products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Icon name="general" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">لا توجد منتجات</p>
                  </td>
                </tr>
              ) : (
                data?.products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0]}
                            alt={product.nameAr}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {product.nameAr}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {product.price} د.ت
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        product.stock > 10 ? 'bg-green-50 text-green-700' :
                        product.stock > 0 ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg ${
                          product.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.isActive ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Icon name="pencil" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
              {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
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
                defaultValue={editingProduct?.name}
                required
                className="text-sm"
              />
              <Field
                label="الاسم (بالعربية)"
                name="nameAr"
                defaultValue={editingProduct?.nameAr}
                required
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="الوصف (بالإنجليزية)"
                name="description"
                defaultValue={editingProduct?.description}
                textarea
                className="text-sm"
              />
              <Field
                label="الوصف (بالعربية)"
                name="descriptionAr"
                defaultValue={editingProduct?.descriptionAr}
                textarea
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field
                label="السعر (د.ت)"
                name="amount"
                type="number"
                step="0.01"
                defaultValue={editingProduct?.amount || editingProduct?.price}
                required
                className="text-sm"
              />
              <Field
                label="رمز المنتج (SKU)"
                name="sku"
                defaultValue={editingProduct?.sku}
                required
                className="text-sm"
              />
              <Field
                label="المخزون"
                name="stock"
                type="number"
                defaultValue={editingProduct?.stock ?? 0}
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفئة
              </label>
              <select
                name="categoryId"
                defaultValue={editingProduct?.categoryId}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              >
                <option value="">اختر فئة</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Field
                label="روابط الصور (مفصولة بفواصل)"
                name="images"
                defaultValue={editingProduct?.images?.join(", ")}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingProduct?.isActive ?? true}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">نشط</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={editingProduct?.isFeatured ?? false}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">مميز</span>
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
                    {editingProduct ? "جاري التحديث..." : "جاري الإضافة..."}
                  </>
                ) : (
                  editingProduct ? "تحديث" : "إضافة"
                )}
              </DashboardButton>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardProductsView;
