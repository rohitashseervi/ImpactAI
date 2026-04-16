import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { ref, push, onValue, update } from 'firebase/database';
import { firestore, realtimeDb } from '../config/firebase';
import {
  Community,
  FieldReport,
  NGO,
  Volunteer,
  Task,
  TaskStatus,
  Notification,
} from '../types';

// ==================== COMMUNITIES ====================

export async function createCommunity(data: Omit<Community, 'communityId' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(firestore, 'communities'), {
    ...data,
    createdAt: Date.now(),
  });
  await updateDoc(docRef, { communityId: docRef.id });
  return docRef.id;
}

export async function getCommunity(id: string): Promise<Community | null> {
  const snap = await getDoc(doc(firestore, 'communities', id));
  return snap.exists() ? (snap.data() as Community) : null;
}

export async function getAllCommunities(): Promise<Community[]> {
  const snap = await getDocs(query(collection(firestore, 'communities'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data() as Community);
}

export async function findCommunityByNameAndPin(name: string, pinCode: string): Promise<Community | null> {
  const q = query(
    collection(firestore, 'communities'),
    where('name', '==', name),
    where('pinCode', '==', pinCode)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as Community);
}

// ==================== FIELD REPORTS ====================

export async function createReport(data: Omit<FieldReport, 'reportId' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(firestore, 'reports'), {
    ...data,
    createdAt: Date.now(),
  });
  await updateDoc(docRef, { reportId: docRef.id });
  return docRef.id;
}

export async function getReportsByCommunity(communityId: string): Promise<FieldReport[]> {
  const q = query(
    collection(firestore, 'reports'),
    where('communityId', '==', communityId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FieldReport);
}

export async function getReportsByNGO(ngoId: string): Promise<FieldReport[]> {
  const q = query(
    collection(firestore, 'reports'),
    where('ngoId', '==', ngoId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FieldReport);
}

export async function getAllReports(): Promise<FieldReport[]> {
  const snap = await getDocs(query(collection(firestore, 'reports'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data() as FieldReport);
}

export async function updateReportStatus(reportId: string, status: FieldReport['status']): Promise<void> {
  await updateDoc(doc(firestore, 'reports', reportId), { status });
}

// ==================== NGO PROFILES ====================

export async function createNGOProfile(data: NGO): Promise<void> {
  await setDoc(doc(firestore, 'ngos', data.ngoId), data);
}

export async function getNGOProfile(ngoId: string): Promise<NGO | null> {
  const snap = await getDoc(doc(firestore, 'ngos', ngoId));
  return snap.exists() ? (snap.data() as NGO) : null;
}

export async function getAllNGOs(): Promise<NGO[]> {
  const snap = await getDocs(collection(firestore, 'ngos'));
  return snap.docs.map((d) => d.data() as NGO);
}

// ==================== VOLUNTEERS ====================

export async function createVolunteerProfile(data: Volunteer): Promise<void> {
  await setDoc(doc(firestore, 'volunteers', data.volunteerId), data);
}

export async function getVolunteerProfile(volunteerId: string): Promise<Volunteer | null> {
  const snap = await getDoc(doc(firestore, 'volunteers', volunteerId));
  return snap.exists() ? (snap.data() as Volunteer) : null;
}

export async function getAllActiveVolunteers(): Promise<Volunteer[]> {
  const q = query(collection(firestore, 'volunteers'), where('isActive', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Volunteer);
}

export async function updateVolunteerProfile(volunteerId: string, data: Partial<Volunteer>): Promise<void> {
  await updateDoc(doc(firestore, 'volunteers', volunteerId), data);
}

// ==================== TASKS ====================

export async function createTask(data: Omit<Task, 'taskId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Date.now();
  const docRef = await addDoc(collection(firestore, 'tasks'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  await updateDoc(docRef, { taskId: docRef.id });
  return docRef.id;
}

export async function getTasksByVolunteer(volunteerId: string): Promise<Task[]> {
  const q = query(
    collection(firestore, 'tasks'),
    where('assignedVolunteerId', '==', volunteerId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Task);
}

export async function getAllTasks(): Promise<Task[]> {
  const snap = await getDocs(query(collection(firestore, 'tasks'), orderBy('urgencyScore', 'desc')));
  return snap.docs.map((d) => d.data() as Task);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  await updateDoc(doc(firestore, 'tasks', taskId), { status, updatedAt: Date.now() });
}

export async function assignVolunteerToTask(
  taskId: string,
  volunteerId: string,
  volunteerName: string,
  matchReason: string
): Promise<void> {
  await updateDoc(doc(firestore, 'tasks', taskId), {
    assignedVolunteerId: volunteerId,
    assignedVolunteerName: volunteerName,
    status: 'assigned' as TaskStatus,
    matchReason,
    updatedAt: Date.now(),
  });
}

// ==================== NOTIFICATIONS (Realtime DB) ====================

export async function sendNotification(
  userId: string,
  notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<void> {
  const notifRef = ref(realtimeDb, `notifications/${userId}`);
  await push(notifRef, {
    ...notification,
    createdAt: Date.now(),
    read: false,
  });
}

export function listenToNotifications(
  userId: string,
  callback: (notifs: Notification[]) => void
): () => void {
  const notifRef = ref(realtimeDb, `notifications/${userId}`);
  const unsubscribe = onValue(notifRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const notifs: Notification[] = Object.entries(data).map(([id, val]: [string, any]) => ({
      id,
      ...val,
    }));
    notifs.sort((a, b) => b.createdAt - a.createdAt);
    callback(notifs);
  });
  return unsubscribe;
}

export async function markNotificationRead(userId: string, notifId: string): Promise<void> {
  const notifRef = ref(realtimeDb, `notifications/${userId}/${notifId}`);
  await update(notifRef, { read: true });
}
