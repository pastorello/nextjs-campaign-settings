/**
 * The URL search params a list page reads. `query` and `page` are the common
 * ones; the index signature is there because filter controls add a param per
 * enabled field, so the set is open. Values are strings (or absent), matching
 * what the data layer's `RawSearchParams` expects.
 */
interface SearchParams {
  query?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default SearchParams;
