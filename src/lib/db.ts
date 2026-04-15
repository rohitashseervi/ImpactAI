/**
 * Offline Database Service using LocalStorage
 * Simulates Isar/Hive for the web environment.
 */

export interface UrgencyResult {
  score: number;
  category: string;
  reason: string;
}

export interface VolunteerMatch {
  volunteerName: string;
  skill: string;
  distance: string;
  matchReason: string;
}

export interface Task {
  id: string;
  aadhaar: string;
  name: string;
  location: string;
  description: string;
  urgency: UrgencyResult;
  manualUrgency?: number; // Added manual rating
  manualCategory?: string; // Added manual category
  timestamp: string;
  status: 'pending' | 'matched' | 'resolved';
  matchedVolunteer?: VolunteerMatch;
  isSynced: boolean; // Track sync status
}

const DB_KEY = 'impact_alloc_tasks';
const MASTER_LIST_KEY = 'impact_alloc_master_list';
const GLOBAL_CLOUD_KEY = 'impact_alloc_global_cloud'; // Simulated Cloud Server

// Initial Master List for testing
const INITIAL_MASTER_LIST = [
  '111122223333',
  '444455556666',
  '777788889999'
];

export const db = {
  init() {
    if (!localStorage.getItem(MASTER_LIST_KEY)) {
      localStorage.setItem(MASTER_LIST_KEY, JSON.stringify(INITIAL_MASTER_LIST));
    }
    if (!localStorage.getItem(DB_KEY)) {
      localStorage.setItem(DB_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(GLOBAL_CLOUD_KEY)) {
      localStorage.setItem(GLOBAL_CLOUD_KEY, JSON.stringify([]));
    }
  },

  getTasks(): Task[] {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveTask(task: Task) {
    const tasks = this.getTasks();
    tasks.push(task);
    localStorage.setItem(DB_KEY, JSON.stringify(tasks));
    
    // Add to local "Done" list
    const masterList = this.getMasterList();
    if (!masterList.includes(task.aadhaar)) {
      masterList.push(task.aadhaar);
      localStorage.setItem(MASTER_LIST_KEY, JSON.stringify(masterList));
    }
  },

  updateTask(updatedTask: Task) {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      localStorage.setItem(DB_KEY, JSON.stringify(tasks));
    }
  },

  getMasterList(): string[] {
    const data = localStorage.getItem(MASTER_LIST_KEY);
    return data ? JSON.parse(data) : [];
  },

  checkAadhaar(aadhaar: string): { exists: boolean, task?: Task, source?: 'local' | 'master' | 'cloud' } {
    const tasks = this.getTasks();
    const existingTask = tasks.find(t => t.aadhaar === aadhaar);
    
    if (existingTask) {
      return { exists: true, task: existingTask, source: 'local' };
    }
    
    const masterList = this.getMasterList();
    if (masterList.includes(aadhaar)) {
      return { exists: true, source: 'master' };
    }

    // Check simulated Cloud Server (in a real app, this would be a network call or a cached list)
    const cloudData = JSON.parse(localStorage.getItem(GLOBAL_CLOUD_KEY) || '[]');
    const cloudTask = cloudData.find((t: Task) => t.aadhaar === aadhaar);
    if (cloudTask) {
      return { exists: true, task: cloudTask, source: 'cloud' };
    }

    return { exists: false };
  },

  // Simulate Syncing with Cloud
  syncWithCloud() {
    const localTasks = this.getTasks();
    const cloudTasks = JSON.parse(localStorage.getItem(GLOBAL_CLOUD_KEY) || '[]');
    
    // 1. Upload local tasks to cloud (Deduplication)
    const cloudAadhaars = new Set(cloudTasks.map((t: Task) => t.aadhaar));
    let uploadedCount = 0;
    
    localTasks.forEach(task => {
      if (!cloudAadhaars.has(task.aadhaar)) {
        cloudTasks.push({ ...task, isSynced: true });
        uploadedCount++;
      }
    });
    
    localStorage.setItem(GLOBAL_CLOUD_KEY, JSON.stringify(cloudTasks));

    // 2. Download from cloud to local Master List (Update local knowledge)
    const masterList = this.getMasterList();
    cloudTasks.forEach((t: Task) => {
      if (!masterList.includes(t.aadhaar)) {
        masterList.push(t.aadhaar);
      }
    });
    localStorage.setItem(MASTER_LIST_KEY, JSON.stringify(masterList));

    // 3. Mark local tasks as synced
    const updatedLocal = localTasks.map(t => ({ ...t, isSynced: true }));
    localStorage.setItem(DB_KEY, JSON.stringify(updatedLocal));

    return uploadedCount;
  },

  // Reset only local phone data
  resetLocalData() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(MASTER_LIST_KEY);
    this.init();
  },

  receivePeerData(peerTask: Task) {
    const tasks = this.getTasks();
    if (!tasks.find(t => t.aadhaar === peerTask.aadhaar)) {
      tasks.push({ ...peerTask, isSynced: false });
      localStorage.setItem(DB_KEY, JSON.stringify(tasks));
      
      const masterList = this.getMasterList();
      if (!masterList.includes(peerTask.aadhaar)) {
        masterList.push(peerTask.aadhaar);
        localStorage.setItem(MASTER_LIST_KEY, JSON.stringify(masterList));
      }
      return true;
    }
    return false;
  }
};
