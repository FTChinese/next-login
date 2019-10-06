export interface IPagination {
    page: number;
    per_page: number;
}

export class Paging {
    private currentPage: number;
    private itemsPerPage: number;

    private size: number

    constructor(current: number = 1, perPage: number = 20) {
        this.currentPage = current;
        this.itemsPerPage = perPage;
    }

    setSize(s: number): Paging {
        this.size = s;
        return this;
    }

    get previousPage(): number {
        return this.currentPage - 1;
    }

    get nextPage(): number {
        return this.currentPage + 1;
    }

    showPrevious(): boolean {
        return this.currentPage > 1;
    }

    showNext(): boolean {
        return this.size >= this.itemsPerPage;
    }

    toObject(): IPagination {
        return {
            page: this.currentPage,
            per_page: this.itemsPerPage,
        }
    }
}
