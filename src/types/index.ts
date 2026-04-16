// --- User Roles ---
export type UserRole = 'ngo' | 'volunteer' | 'admin';

// --- Auth User Profile (Firestore /users/{uid}) ---
export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  createdAt: number;
}

// --- Community (Firestore /communities/{communityId}) ---
export type AreaType = 'rural' | 'urban' | 'tribal' | 'camp';

export interface Community {
  communityId: string;
  name: string;
  location: { lat: number; lng: number };
  locationText: string;
  district: string;
  state: string;
  pinCode: string;
  populationApprox: number;
  areaType: AreaType;
  createdAt: number;
}

// --- Field Report (Firestore /reports/{reportId}) ---
export type NeedCategory = 'Medical' | 'Water' | 'Food' | 'Shelter' | 'Sanitation' | 'Education';

export type ReportStatus = 'pending' | 'verified' | 'task-created' | 'resolved';

export interface FieldReport {
  reportId: string;
  communityId: string;
  communityName: string;
  ngoId: string;
  ngoName: string;
  fieldWorkerName: string;
  needCategory: NeedCategory;
  description: string;
  peopleAffected: number;
  currentResources: string;
  urgencyScore: number;
  manualUrgency: number;
  sourceType: 'manual' | 'ocr';
  dateOfSurvey: string;
  createdAt: number;
  status: ReportStatus;
}

// --- NGO Profile (Firestore /ngos/{ngoId}) ---
export interface NGO {
  ngoId: string;
  orgName: string;
  location: { lat: number; lng: number };
  locationText: string;
  focusAreas: NeedCategory[];
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: number;
}

// --- Volunteer (Firestore /volunteers/{volunteerId}) ---
export type Availability = 'full-time' | 'part-time' | 'weekends' | 'on-call';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'experienced';

export interface Volunteer {
  volunteerId: string;
  name: string;
  skills: string[];
  location: { lat: number; lng: number };
  locationText: string;
  availability: Availability;
  languages: string[];
  contactPhone: string;
  contactEmail: string;
  experienceLevel: ExperienceLevel;
  willingToTravel: boolean;
  maxTravelKm: number;
  isActive: boolean;
  createdAt: number;
}

// --- Task (Firestore /tasks/{taskId}) ---
export type TaskStatus = 'open' | 'assigned' | 'in-progress' | 'completed';

export interface Task {
  taskId: string;
  reportId: string;
  communityId: string;
  communityName: string;
  category: NeedCategory;
  description: string;
  urgencyScore: number;
  assignedVolunteerId: string | null;
  assignedVolunteerName: string | null;
  status: TaskStatus;
  matchReason: string;
  location: { lat: number; lng: number };
  createdAt: number;
  updatedAt: number;
}

// --- Notification (Realtime DB /notifications/{userId}/{notifId}) ---
export type NotificationType = 'task-assigned' | 'report-verified' | 'status-update' | 'system';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: number;
  linkTo?: string;
}
