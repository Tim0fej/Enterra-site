import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StaffRoute } from './components/StaffRoute';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { ForumPage } from './pages/ForumPage';
import { ForumCategoryPage } from './pages/ForumCategoryPage';
import { ForumTopicPage } from './pages/ForumTopicPage';
import { NewTicketPage } from './pages/NewTicketPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { TicketMessengerLayout, TicketChatPlaceholder } from './components/TicketMessengerLayout';
import { AdminPage } from './pages/AdminPage';
import { ModerPage } from './pages/ModerPage';
import { SupportPage } from './pages/SupportPage';
import { MediaApplyPage } from './pages/MediaApplyPage';
import { ModsPage } from './pages/ModsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="forum" element={<ForumPage />} />
            <Route path="forum/:slug" element={<ForumCategoryPage />} />
            <Route path="forum/topic/:id" element={<ForumTopicPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="mods" element={<ModsPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="support/media" element={<MediaApplyPage />} />
              <Route path="tickets" element={<TicketMessengerLayout />}>
                <Route index element={<TicketChatPlaceholder />} />
                <Route path="new" element={<NewTicketPage />} />
                <Route path=":id" element={<TicketDetailPage />} />
              </Route>
            </Route>

            <Route element={<StaffRoute roles={['moderator', 'admin']} />}>
              <Route path="moder" element={<ModerPage />} />
            </Route>

            <Route element={<StaffRoute roles={['admin']} />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
