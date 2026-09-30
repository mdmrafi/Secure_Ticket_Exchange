import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { HomePage } from '../pages/HomePage.jsx';
import { ListingsPage } from '../pages/ListingsPage.jsx';
import { VerifyAssetPage } from '../pages/VerifyAssetPage.jsx';
import { EscrowDashboardPage } from '../pages/EscrowDashboardPage.jsx';
import { ArchitecturePage } from '../pages/ArchitecturePage.jsx';
import { AdminDashboardPage } from '../pages/AdminDashboardPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="verify" element={<VerifyAssetPage />} />
        <Route path="escrow" element={<EscrowDashboardPage />} />
        <Route path="architecture" element={<ArchitecturePage />} />
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
