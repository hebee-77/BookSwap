import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');

  if (isChat) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
        <Navbar />
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
