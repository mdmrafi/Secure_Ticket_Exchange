import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.jsx';

// Core Pages
import { HomePage } from '../pages/HomePage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

// Auth Flow
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { RegisterPage } from '../pages/auth/RegisterPage.jsx';
import { EmailVerificationPage } from '../pages/auth/EmailVerificationPage.jsx';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage.jsx';

// User & KYC
import { UserDashboardPage } from '../pages/dashboard/UserDashboardPage.jsx';
import { KycVerificationPage } from '../pages/kyc/KycVerificationPage.jsx';
import { ProfileSettingsPage } from '../pages/profile/ProfileSettingsPage.jsx';

// Marketplace & Asset Details
import { MarketplacePage } from '../pages/marketplace/MarketplacePage.jsx';
import { AssetDetailsPage } from '../pages/marketplace/AssetDetailsPage.jsx';

// Upload & Verification Pipeline
import { UploadVerificationPage } from '../pages/upload/UploadVerificationPage.jsx';

// Listings
import { CreateListingPage } from '../pages/listings/CreateListingPage.jsx';

// Transactions & Reservation
import { ReservationPage } from '../pages/transactions/ReservationPage.jsx';
import { TransactionFlowPage } from '../pages/transactions/TransactionFlowPage.jsx';

// Messaging & Notifications
import { MessagingPage } from '../pages/messages/MessagingPage.jsx';
import { NotificationsPage } from '../pages/notifications/NotificationsPage.jsx';

// Admin & Moderation Console
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.jsx';
import { AdminKycReviewPage } from '../pages/admin/AdminKycReviewPage.jsx';
import { AdminRiskCenterPage } from '../pages/admin/AdminRiskCenterPage.jsx';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage.jsx';

// Design System & Edge States Showcases
import { DesignSystemShowcasePage } from '../pages/common/DesignSystemShowcasePage.jsx';
import { EdgeStatesPage } from '../pages/common/EdgeStatesPage.jsx';

// Legacy / Architectural Pages
import { ListingsPage } from '../pages/ListingsPage.jsx';
import { VerifyAssetPage } from '../pages/VerifyAssetPage.jsx';
import { EscrowDashboardPage } from '../pages/EscrowDashboardPage.jsx';
import { ArchitecturePage } from '../pages/ArchitecturePage.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* Landing */}
        <Route index element={<HomePage />} />

        {/* Authentication */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<EmailVerificationPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />

        {/* User Portal */}
        <Route path="dashboard" element={<UserDashboardPage />} />
        <Route path="kyc" element={<KycVerificationPage />} />
        <Route path="profile" element={<ProfileSettingsPage />} />

        {/* Marketplace */}
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="asset/:id" element={<AssetDetailsPage />} />

        {/* Upload & Verification */}
        <Route path="upload" element={<UploadVerificationPage />} />

        {/* Listings */}
        <Route path="create-listing" element={<CreateListingPage />} />

        {/* Reservations & Transactions */}
        <Route path="reserve/:id" element={<ReservationPage />} />
        <Route path="transaction/:id" element={<TransactionFlowPage />} />

        {/* Secure Messaging & Notifications */}
        <Route path="messages" element={<MessagingPage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Admin & Security Moderation */}
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="admin/kyc" element={<AdminKycReviewPage />} />
        <Route path="admin/risk" element={<AdminRiskCenterPage />} />
        <Route path="admin/audit" element={<AdminAuditLogsPage />} />

        {/* Design System & Edge Case Recovery */}
        <Route path="design-system" element={<DesignSystemShowcasePage />} />
        <Route path="edge-states" element={<EdgeStatesPage />} />

        {/* Legacy / Architecture compatibility */}
        <Route path="listings" element={<ListingsPage />} />
        <Route path="verify" element={<VerifyAssetPage />} />
        <Route path="escrow" element={<EscrowDashboardPage />} />
        <Route path="architecture" element={<ArchitecturePage />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
