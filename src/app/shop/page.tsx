import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { getQueryClient } from "@/trpc/query-client";
import { trpc } from "@/trpc/server";
import ShopView from "@/modules/shop/ui/views/shop-view";

const page = async ({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = typeof params.search === 'string' ? params.search : '';
    const categoryId = typeof params.category === 'string' ? params.category : '';
    const sortBy = (typeof params.sort === 'string' ? params.sort : 'newest') as 'newest' | 'price-asc' | 'price-desc' | 'popular';

    const queryClient = getQueryClient();
    
    await queryClient.prefetchQuery(
        trpc.products.getMany.queryOptions({
            page,
            pageSize: 12,
            search,
            categoryId: categoryId || undefined,
            sortBy,
        })
    );

    await queryClient.prefetchQuery(
        trpc.categories.getAll.queryOptions()
    );

    return (
        <NuqsAdapter>
            <HydrationBoundary state={dehydrate(queryClient)}>
                    <ShopView />
            </HydrationBoundary>
        </NuqsAdapter>
    );
};

export default page;

