import type { DisplayGroupId, MediaPlatform } from '../../shared/displayGroup';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  accessCode: string;
  codeVerified: boolean;
  codeExpiresAt: string;
  emailVerified?: boolean;
  createdAt?: string;
  privilege?: {
    slug: string;
    name: string;
    color: string;
    mediaPlatform?: MediaPlatform | null;
    expiresAt?: string | null;
  } | null;
  displayGroup?: DisplayGroupId;
  luckPermsGroup?: string;
  mediaPlatform?: MediaPlatform | null;
  nameColor?: string | null;
  nameColorAllowed?: boolean;
}

export interface AuthResponse {
  user: User;
  verificationReset?: boolean;
}

export interface WebSession {
  id: string;
  deviceLabel: string;
  ipMasked: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

export interface LoginVerificationResponse {
  requiresVerification: true;
  challengeToken: string;
  maskedEmail: string;
  message: string;
}

export type LoginResponse = AuthResponse | LoginVerificationResponse;

export function isLoginVerificationResponse(
  data: LoginResponse,
): data is LoginVerificationResponse {
  return 'requiresVerification' in data && data.requiresVerification === true;
}

export interface ForumCategory {
  id: number;
  name: string;
  description: string;
  slug: string;
  topic_count: number;
  post_count?: number;
  last_topic_title?: string | null;
  last_topic_id?: number | null;
  last_post_at?: string | null;
  last_post_author?: string | null;
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
  last_message?: string | null;
  last_author?: string | null;
}

export interface ForumPost {
  id: number;
  content: string;
  author: string;
  role: UserRole;
  created_at: string;
  attachments?: import('../../shared/attachments').Attachment[];
}

export type TicketType = 'general' | 'support' | 'media' | 'vip';
export type TicketStatus = 'open' | 'in_progress' | 'closed';

export interface Ticket {
  id: number;
  title: string;
  status: TicketStatus;
  type: TicketType;
  author?: string;
  assigned_to?: number | null;
  assignee?: string | null;
  last_message?: string | null;
  is_guest?: boolean;
  guest_name?: string | null;
  guest_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketStaffMember {
  id: number;
  username: string;
  role: UserRole;
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
