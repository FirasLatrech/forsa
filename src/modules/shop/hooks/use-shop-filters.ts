import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';

export const useShopFilters = () => {
    const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
    const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
    const [categoryId, setCategoryId] = useQueryState('category', parseAsString.withDefault(''));
    const [sortBy, setSortBy] = useQueryState(
        'sort',
        parseAsString.withDefault('newest') as any
    );

    return [
        {
            page,
            search,
            categoryId,
            sortBy: sortBy as 'newest' | 'price-asc' | 'price-desc' | 'popular',
        },
        {
            setPage,
            setSearch,
            setCategoryId,
            setSortBy,
        },
    ] as const;
};

