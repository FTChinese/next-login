export interface IPagination {
    page: number;
    per_page: number;
}

export class Paging {
    private currentPage: number;
    private itemsPerPage: number;

    // The number of items shown on current page.
    // If size < itemsPerPage, it indicates there
    // are no more items and Next Page button
    // won't be shown.
    private size: number = 0;

    constructor(current: number = 1, perPage: number = 20) {
        this.currentPage = current;
        this.itemsPerPage = perPage;
    }

    setSize(s: number): Paging {
        this.size = s;
        return this;
    }

    get previous(): number {
        return this.currentPage - 1;
    }

    get next(): number {
        return this.currentPage + 1;
    }

    get hasPrevious(): boolean {
        return this.currentPage > 1;
    }

    get hasNext(): boolean {
        return this.size >= this.itemsPerPage;
    }

    toObject(): IPagination {
        return {
            page: this.currentPage,
            per_page: this.itemsPerPage,
        }
    }
}
