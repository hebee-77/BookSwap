import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/BooksPage';
import { BookDetailsPage } from './pages/BookDetailsPage';
import { AddBookPage } from './pages/AddBookPage';
import { EditBookPage } from './pages/EditBookPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SwapRequestsPage } from './pages/SwapRequestsPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyBooksPage } from './pages/MyBooksPage';
import { NotificationsPage } from './pages/NotificationsPage';
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="books" element={<BooksPage />} />
          <Route path="books/:id" element={<BookDetailsPage />} />
          <Route
            path="books/new"
            element={
              <ProtectedRoute>
                <AddBookPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="books/:id/edit"
            element={
              <ProtectedRoute>
                <EditBookPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="swap-requests"
            element={
              <ProtectedRoute>
                <SwapRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-books"
            element={
              <ProtectedRoute>
                <MyBooksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
