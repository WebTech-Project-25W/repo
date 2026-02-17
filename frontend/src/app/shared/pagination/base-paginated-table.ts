export abstract class BasePaginatedTable<T> {
  data: T[] = [];
  currentPage = 0;
  limit = 10;
  totalEntries = 0;

  abstract loadData(): void;

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.loadData();
  }

  onLimitChange(newLimit: number) {
    this.limit = newLimit;
    this.currentPage = 0;
    this.loadData();
  }

  get startIndex() { return this.currentPage * this.limit; }
  get endIndex() { return Math.min(this.startIndex + this.limit, this.totalEntries); }
}