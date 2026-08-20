export type BookCondition = 'NEW' | 'GOOD' | 'FAIR' | 'POOR';

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  bookCondition: BookCondition;
  ownerId: number;
  createdAt: string;
  available: boolean;
  imageUrl?: string | null;
}

export interface BookRequest {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  bookCondition: BookCondition;
  imageUrl?: string | null;
}

export interface BookPageResponse {
  content: Book[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface BookQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
  keyword?: string;
  condition?: BookCondition | '';
}
