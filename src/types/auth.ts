import type { DisplayGroupId, MediaPlatform } from '../../shared/displayGroup';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  accessCode: string;
  codeVerified: boolean;
  createdAt?: string;
  privilege?: {
    slug: string;
    name: string;
    color: string;
    mediaPlatform?: MediaPlatform | null;
  } | null;
  displayGroup?: DisplayGroupId;
  luckPermsGroup?: string;
  mediaPlatform?: MediaPlatform | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ForumCategory {
  id: number;
  name: string;
  description: string;
  slug: string;
  topic_count: number;
}

export interface ForumTopic {
  id: number;
  title: string;
  author: string;
  pinned: number;
  locked: number;
  post_count: number;
  last_post_at: string;
  created_at: string;
}

export interface ForumPost {
  id: number;
  content: string;
  author: string;
  role: UserRole;
  created_at: string;
  attachments?: import('../../shared/attachments').Attachment[];
}

export type TicketType = 'general' | 'support' | 'media';
export type TicketStatus = 'open' | 'in_progress' | 'closed';

export interface Ticket {
  id: number;
  title: string;
  status: TicketStatus;
  type: TicketType;
  author?: string;
  last_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  content: string;
  author: string;
  role: UserRole;
  is_staff: number;
  created_at: string;
  attachments?: import('../../shared/attachments').Attachment[];
}
