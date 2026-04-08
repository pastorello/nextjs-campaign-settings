import { usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useRouter } from "next/router";

import QueryParam from "../../definitions/interfaces/pages/QueryParam";

const setSearchParams = useDebouncedCallback(
  (queryTerms: QueryParam[], searchParams) => {
    const pathname = usePathname();
    const { replace } = useRouter();

    const params = new URLSearchParams(searchParams);

    queryTerms.forEach((item: QueryParam) => {
      if (item.value) {
        params.set(item.term, item.value);
      } else {
        params.delete(item.term);
      }
    });

    replace(`${pathname}?${params.toString()}`);
  },
  300
);

export default setSearchParams;
