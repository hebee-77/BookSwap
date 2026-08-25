import api from './api';
import type { Book, BookRequest, BookPageResponse, BookQueryParams } from '../types/book';

export const bookService = {
  getBooks: async (params?: BookQueryParams): Promise<BookPageResponse> => {
    const hasKeyword = !!params?.keyword?.trim();
    const hasCondition = !!params?.condition;

    if (hasKeyword) {
      const searchParams = { ...params };
      if (!searchParams.condition) delete searchParams.condition;
      const response = await api.get<BookPageResponse>('/books/search', { params: searchParams });
      return response.data;
    }

    if (hasCondition) {
      const filterParams = { ...params };
      if (!filterParams.keyword) delete filterParams.keyword;
      const response = await api.get<BookPageResponse>('/books/filter', { params: filterParams });
      return response.data;
    }

    const response = await api.get<BookPageResponse>('/books', { params });
    return response.data;
  },

  getBookById: async (id: number): Promise<Book> => {
    const response = await api.get<Book>(`/books/${id}`);
    return response.data;
  },

  createBook: async (book: FormData | BookRequest): Promise<Book> => {
    const isFormData = book instanceof FormData;
    const response = await api.post<Book>('/books', book, {
      headers: isFormData ? { 'Content-Type': undefined } : undefined,
    });
    return response.data;
  },

  updateBook: async (id: number, book: FormData | BookRequest): Promise<Book> => {
    const isFormData = book instanceof FormData;
    const response = await api.put<Book>(`/books/${id}`, book, {
      headers: isFormData ? { 'Content-Type': undefined } : undefined,
    });
    return response.data;
  },

  deleteBook: async (id: number): Promise<void> => {
    await api.delete(`/books/${id}`);
  },

  getBooksByOwner: async (ownerId: number, params?: BookQueryParams): Promise<BookPageResponse> => {
    const response = await api.get<BookPageResponse>(`/books/owner/${ownerId}`, { params });
    return response.data;
  },
};
