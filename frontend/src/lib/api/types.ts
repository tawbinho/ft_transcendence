/** One page of a long list, as every list route of the backend returns it. */
export interface Page<T> {
  items: T[];
  /** How many items exist in total (for the page count). */
  total: number;
  limit: number;
  offset: number;
}
