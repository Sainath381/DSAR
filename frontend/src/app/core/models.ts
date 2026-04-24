export type Role = 'CUSTOMER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export type DsarType = 'ACCESS' | 'DELETE' | 'CORRECT';

export type DsarStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export interface DsarRequest {
  id: string;
  requesterId: string;
  requesterEmail?: string;
  requesterName?: string;
  type: DsarType;
  status: DsarStatus;
  payload: unknown;
  result?: unknown;
  assignedAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
  slaDueAt: string;
  daysRemaining?: number;
}

export interface AuditEntry {
  id: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  ipAddress?: string | null;
  timestamp: string;
}

export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
}
