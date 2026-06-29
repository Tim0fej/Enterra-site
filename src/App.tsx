import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StaffRoute } from './components/StaffRoute';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { ForumPage } from './pages/ForumPage';
import { ForumCategoryPage } from './pages/ForumCategoryPage';
import { ForumTopicPage } from './pages/ForumTopicPage';
import { ForumNewTopicPage } from './pages/ForumNewTopicPage';
import {
  ForumMessengerLayout,
  ForumChatPlaceholder,
} from './components/ForumMessengerLayout';
import { NewTicketPage } from './pages/NewTicketPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { TicketMessengerLayout, TicketChatPlaceholder } from './components/TicketMessengerLayout';
import { AdminPage } from './pages/AdminPage';
import { ModerPage } from './pages/ModerPage';
import { StaffGuidePage } from './pages/StaffGuidePage';
import { ShopPage } from './pages/ShopPage';
import { MediaPage } from './pages/MediaPage';
import { MediaApplyPage } from './pages/MediaApplyPage';
import { ModsPage } from './pages/ModsPage';
import { FaqPage } from './pages/FaqPage';
import { TermsPage } from './pages/TermsPage';
import { RefundPage } from './pages/RefundPage';
import { RulesPage } from './pages/RulesPage';
import { LegacySupportMediaRedirect } from './components/LegacySupportMediaRedirect';
import { NotFoundPage, ForbiddenPage, TooManyRequestsPage, ServerErrorPage, GatewayTimeoutPage } from './pages/ErrorPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ErrorBoundary>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="forum" element={<ForumPage />} />
            <Route path="forum/general" element={<ForumMessengerLayout />}>
              <Route index element={<ForumChatPlaceholder />} />
              <Route path="new" element={<ForumNewTopicPage />} />
              <Route path="topic/:id" element={<ForumTopicPage chatMode />} />
            </Route>
            <Route path="forum/topic/:id" element={<ForumTopicPage />} />
            <Route path="forum/:slug" element={<ForumCategoryPage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="support" element={<Navigate to="/shop" replace />} />
            <Route path="support/vip" element={<Navigate to="/shop" replace />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="refund" element={<RefundPage />} />
            <Route path="legal" element={<Navigate to="/refund" replace />} />

            <Route path="tickets" element={<TicketMessengerLayout />}>
              <Route index element={<TicketChatPlaceholder />} />
              <Route path="new" element={<NewTicketPage />} />
              <Route path=":id" element={<TicketDetailPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="mods" element={<ModsPage />} />
              <Route path="media/apply" element={<MediaApplyPage />} />
              <Route path="support/media" element={<LegacySupportMediaRedirect />} />
            </Route>

            <Route element={<StaffRoute roles={['moderator', 'admin']} />}>
              <Route path="moder" element={<ModerPage />} />
              <Route path="staff-guide" element={<StaffGuidePage />} />
            </Route>

            <Route element={<StaffRoute roles={['admin']} />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>

            <Route path="403" element={<ForbiddenPage />} />
            <Route path="404" element={<NotFoundPage />} />
            <Route path="429" element={<TooManyRequestsPage />} />
            <Route path="500" element={<ServerErrorPage />} />
            <Route path="504" element={<GatewayTimeoutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}
