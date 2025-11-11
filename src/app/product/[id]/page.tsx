import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProductDetailView, { ProductDetailViewSuspense } from "@/modules/product/ui/views/product-detail-view";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const queryClient = getQueryClient();
  
  try {
    await queryClient.prefetchQuery(
      trpc.products.getBySlug.queryOptions({
        slug: id,
      })
    );
  } catch (error) {
    notFound();
  }
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ProductDetailViewSuspense />}>
        <ProductDetailView productSlug={id} />
      </Suspense>
    </HydrationBoundary>
  );
};

export default page;

