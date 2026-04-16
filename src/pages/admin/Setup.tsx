import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../config/firebase';
import {
  createCommunity,
  createReport,
  createVolunteerProfile,
  createNGOProfile,
} from '../../lib/firestore';
import { UserProfile, Community, FieldReport, Volunteer, NGO, NeedCategory } from '../../types';

const SEED_COMMUNITIES = [
  { name: 'Rampur Village', district: 'Lucknow', state: 'Uttar Pradesh', pinCode: '226001', populationApprox: 3200, areaType: 'rural' as const, location: { lat: 26.8467, lng: 80.9462 } },
  { name: 'Dharavi Sector 5', district: 'Mumbai', state: 'Maharashtra', pinCode: '400017', populationApprox: 8500, areaType: 'urban' as const, location: { lat: 19.0430, lng: 72.8567 } },
  { name: 'Sundarbans Block A', district: 'South 24 Parganas', state: 'West Bengal', pinCode: '743370', populationApprox: 1200, areaType: 'rural' as const, location: { lat: 21.9497, lng: 88.8847 } },
  { name: 'Thar Settlement', district: 'Jaisalmer', state: 'Rajasthan', pinCode: '345001', populationApprox: 600, areaType: 'tribal' as const, location: { lat: 26.9157, lng: 70.9083 } },
  { name: 'Bangalore Relief Camp', district: 'Bangalore Urban', state: 'Karnataka', pinCode: '560001', populationApprox: 2000, areaType: 'camp' as const, location: { lat: 12.9716, lng: 77.5946 } },
  { name: 'Majuli Island Village', district: 'Majuli', state: 'Assam', pinCode: '785104', populationApprox: 950, areaType: 'rural' as const, location: { lat: 26.9500, lng: 94.1667 } },
  { name: 'Kochi Waterfront Slum', district: 'Ernakulam', state: 'Kerala', pinCode: '682001', populationApprox: 1800, areaType: 'urban' as const, location: { lat: 9.9312, lng: 76.2673 } },
];

const SEED_REPORTS: { communityIdx: number; ngoIdx: number; category: NeedCategory; description: string; peopleAffected: number; urgency: number; fieldWorker: string; resources: string }[] = [
  { communityIdx: 0, ngoIdx: 0, category: 'Water', description: 'Village handpump broken for 2 weeks, 300+ families relying on a distant well 3km away. Children are falling sick due to contaminated well water.', peopleAffected: 1500, urgency: 9, fieldWorker: 'Anita Sharma', resources: 'One tanker visits weekly' },
  { communityIdx: 0, ngoIdx: 1, category: 'Medical', description: 'No primary health center within 15km. Three pregnant women need urgent prenatal care. Several cases of waterborne diseases reported.', peopleAffected: 800, urgency: 8, fieldWorker: 'Dr. Verma', resources: 'Nearest hospital 15km' },
  { communityIdx: 1, ngoIdx: 0, category: 'Sanitation', description: 'Open drainage running through residential area. Monsoon flooding causing sewage overflow into homes. Risk of cholera outbreak.', peopleAffected: 3000, urgency: 8, fieldWorker: 'Rahul Patil', resources: 'Municipal cleaning scheduled monthly' },
  { communityIdx: 1, ngoIdx: 2, category: 'Food', description: 'Ration shop closed for past month. Many daily wage workers lost jobs and cannot afford food. Children showing signs of malnutrition.', peopleAffected: 2500, urgency: 9, fieldWorker: 'Priya Desai', resources: 'Community kitchen runs 3 days/week' },
  { communityIdx: 2, ngoIdx: 1, category: 'Medical', description: 'Severe flooding has left 200 families stranded. Multiple snake bite cases reported. No medical supplies available on the island.', peopleAffected: 800, urgency: 10, fieldWorker: 'Subhash Roy', resources: 'None available' },
  { communityIdx: 2, ngoIdx: 0, category: 'Shelter', description: 'Cyclone damaged 80% of houses. Families living under temporary tarpaulin sheets. Heavy rain expected next week.', peopleAffected: 950, urgency: 9, fieldWorker: 'Moumita Sen', resources: 'NDRF provided 20 tents' },
  { communityIdx: 3, ngoIdx: 2, category: 'Water', description: 'Severe drought — only water source is a government tanker that comes once in 4 days. Livestock dying, crops failed.', peopleAffected: 600, urgency: 10, fieldWorker: 'Bhairav Singh', resources: 'Government tanker every 4 days' },
  { communityIdx: 3, ngoIdx: 1, category: 'Education', description: 'Nearest school 12km away. No transport. 85 children of school age not attending any school.', peopleAffected: 85, urgency: 4, fieldWorker: 'Lakshmi Devi', resources: 'One volunteer teacher visits weekly' },
  { communityIdx: 4, ngoIdx: 0, category: 'Medical', description: 'Relief camp has 2000 displaced people. Only 1 doctor available. Outbreak of dengue fever — 40 confirmed cases.', peopleAffected: 2000, urgency: 10, fieldWorker: 'Dr. Krishnamurthy', resources: '1 doctor, limited medicines' },
  { communityIdx: 4, ngoIdx: 2, category: 'Food', description: 'Camp food supply running out. Government rations delayed by 10 days. Children and elderly at high risk.', peopleAffected: 2000, urgency: 9, fieldWorker: 'Amrita Shetty', resources: 'Local temples donating meals' },
  { communityIdx: 5, ngoIdx: 1, category: 'Shelter', description: 'Annual floods have submerged entire village. 150 families displaced. Temporary shelters are overcrowded.', peopleAffected: 700, urgency: 8, fieldWorker: 'Jatin Bora', resources: 'Government boats for evacuation' },
  { communityIdx: 5, ngoIdx: 0, category: 'Water', description: 'Flood contaminated all local water sources. People drinking river water. Multiple diarrhea cases among children.', peopleAffected: 950, urgency: 9, fieldWorker: 'Dimple Hazarika', resources: 'None' },
  { communityIdx: 6, ngoIdx: 2, category: 'Sanitation', description: 'Slum area has no toilet facilities. Open defecation is norm. Women face safety issues. Skin diseases spreading.', peopleAffected: 1200, urgency: 7, fieldWorker: 'George Thomas', resources: 'NGO built 5 toilets last year' },
  { communityIdx: 6, ngoIdx: 0, category: 'Education', description: '120 children have dropped out of school due to economic issues. No free education centers nearby.', peopleAffected: 120, urgency: 3, fieldWorker: 'Mary Sebastian', resources: 'Church runs Sunday school' },
  { communityIdx: 1, ngoIdx: 1, category: 'Medical', description: 'TB cases rising in the area. No screening available. 3 confirmed deaths in last month.', peopleAffected: 500, urgency: 9, fieldWorker: 'Dr. Nair', resources: 'Government TB program but not reaching here' },
];

const SEED_NGOS: Omit<NGO, 'ngoId' | 'createdAt'>[] = [
  { orgName: 'HelpIndia Foundation', location: { lat: 28.6139, lng: 77.2090 }, locationText: 'Delhi, NCR', focusAreas: ['Medical', 'Water', 'Sanitation'], contactPerson: 'Rajesh Kumar', contactEmail: 'help@helpindia.org', contactPhone: '9876543210' },
  { orgName: 'CareFirst NGO', location: { lat: 19.0760, lng: 72.8777 }, locationText: 'Mumbai, Maharashtra', focusAreas: ['Medical', 'Education', 'Shelter'], contactPerson: 'Sneha Patel', contactEmail: 'info@carefirst.org', contactPhone: '9876543211' },
  { orgName: 'GreenRelief Trust', location: { lat: 12.9716, lng: 77.5946 }, locationText: 'Bangalore, Karnataka', focusAreas: ['Food', 'Water', 'Sanitation'], contactPerson: 'Arun Reddy', contactEmail: 'contact@greenrelief.org', contactPhone: '9876543212' },
];

const SEED_VOLUNTEERS: Omit<Volunteer, 'volunteerId' | 'createdAt'>[] = [
  { name: 'Dr. Priya Mehta', skills: ['Doctor', 'Paramedic'], location: { lat: 19.0760, lng: 72.8777 }, locationText: 'Mumbai, Maharashtra', availability: 'full-time', languages: ['Hindi', 'English', 'Marathi'], contactPhone: '9900110011', contactEmail: 'priya@email.com', experienceLevel: 'experienced', willingToTravel: true, maxTravelKm: 200, isActive: true },
  { name: 'Arjun Singh', skills: ['Driver', 'Supply Chain'], location: { lat: 28.6139, lng: 77.2090 }, locationText: 'Delhi, NCR', availability: 'full-time', languages: ['Hindi', 'English', 'Punjabi'], contactPhone: '9900110022', contactEmail: 'arjun@email.com', experienceLevel: 'intermediate', willingToTravel: true, maxTravelKm: 500, isActive: true },
  { name: 'Kavitha Rajan', skills: ['Nurse', 'Social Worker'], location: { lat: 12.9716, lng: 77.5946 }, locationText: 'Bangalore, Karnataka', availability: 'part-time', languages: ['Kannada', 'English', 'Tamil'], contactPhone: '9900110033', contactEmail: 'kavitha@email.com', experienceLevel: 'experienced', willingToTravel: true, maxTravelKm: 100, isActive: true },
  { name: 'Mohit Sharma', skills: ['Plumber', 'Engineer'], location: { lat: 26.8467, lng: 80.9462 }, locationText: 'Lucknow, UP', availability: 'weekends', languages: ['Hindi', 'English'], contactPhone: '9900110044', contactEmail: 'mohit@email.com', experienceLevel: 'intermediate', willingToTravel: true, maxTravelKm: 150, isActive: true },
  { name: 'Fatima Begum', skills: ['Teacher', 'Translator'], location: { lat: 22.5726, lng: 88.3639 }, locationText: 'Kolkata, West Bengal', availability: 'full-time', languages: ['Bengali', 'Hindi', 'English', 'Urdu'], contactPhone: '9900110055', contactEmail: 'fatima@email.com', experienceLevel: 'experienced', willingToTravel: true, maxTravelKm: 300, isActive: true },
  { name: 'Ravi Kumar', skills: ['Construction', 'Engineer'], location: { lat: 26.9157, lng: 70.9083 }, locationText: 'Jaisalmer, Rajasthan', availability: 'on-call', languages: ['Hindi', 'Rajasthani'], contactPhone: '9900110066', contactEmail: 'ravi@email.com', experienceLevel: 'beginner', willingToTravel: true, maxTravelKm: 100, isActive: true },
  { name: 'Shalini Nair', skills: ['Cook', 'Social Worker'], location: { lat: 9.9312, lng: 76.2673 }, locationText: 'Kochi, Kerala', availability: 'full-time', languages: ['Malayalam', 'English', 'Tamil'], contactPhone: '9900110077', contactEmail: 'shalini@email.com', experienceLevel: 'intermediate', willingToTravel: false, maxTravelKm: 50, isActive: true },
  { name: 'Deepak Bora', skills: ['Paramedic', 'Driver'], location: { lat: 26.1445, lng: 91.7362 }, locationText: 'Guwahati, Assam', availability: 'full-time', languages: ['Assamese', 'Hindi', 'English'], contactPhone: '9900110088', contactEmail: 'deepak@email.com', experienceLevel: 'experienced', willingToTravel: true, maxTravelKm: 400, isActive: true },
  { name: 'Ananya Iyer', skills: ['Sanitation Worker', 'Social Worker'], location: { lat: 13.0827, lng: 80.2707 }, locationText: 'Chennai, Tamil Nadu', availability: 'weekends', languages: ['Tamil', 'English'], contactPhone: '9900110099', contactEmail: 'ananya@email.com', experienceLevel: 'beginner', willingToTravel: true, maxTravelKm: 80, isActive: true },
  { name: 'Vikram Thapar', skills: ['IT Support', 'Supply Chain'], location: { lat: 30.7333, lng: 76.7794 }, locationText: 'Chandigarh, Punjab', availability: 'part-time', languages: ['Hindi', 'English', 'Punjabi'], contactPhone: '9900110100', contactEmail: 'vikram@email.com', experienceLevel: 'intermediate', willingToTravel: true, maxTravelKm: 250, isActive: true },
];

export default function AdminSetup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'admin' | 'seeding' | 'done'>('admin');
  const [progress, setProgress] = useState('');
  const [adminCreated, setAdminCreated] = useState(false);
  const navigate = useNavigate();

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const profile: UserProfile = {
        uid: cred.user.uid,
        email,
        role: 'admin',
        displayName: 'Admin',
        createdAt: Date.now(),
      };
      await setDoc(doc(firestore, 'users', cred.user.uid), profile);
      setAdminCreated(true);
      setStep('seeding');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already exists. Try logging in instead.');
      } else {
        setError(err.message);
      }
    }
  };

  const seedData = async () => {
    setProgress('Creating NGO profiles...');
    const ngoIds: string[] = [];
    for (const ngo of SEED_NGOS) {
      // Create fake NGO user
      try {
        const cred = await createUserWithEmailAndPassword(auth, ngo.contactEmail, 'demo123456');
        const uid = cred.user.uid;
        ngoIds.push(uid);
        await setDoc(doc(firestore, 'users', uid), {
          uid, email: ngo.contactEmail, role: 'ngo', displayName: ngo.orgName, createdAt: Date.now(),
        } as UserProfile);
        await createNGOProfile({ ...ngo, ngoId: uid, createdAt: Date.now() });
      } catch (err: any) {
        // If email exists, just push a placeholder
        ngoIds.push(`ngo_${SEED_NGOS.indexOf(ngo)}`);
      }
    }

    setProgress('Creating volunteer profiles...');
    const volIds: string[] = [];
    for (const vol of SEED_VOLUNTEERS) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, vol.contactEmail, 'demo123456');
        const uid = cred.user.uid;
        volIds.push(uid);
        await setDoc(doc(firestore, 'users', uid), {
          uid, email: vol.contactEmail, role: 'volunteer', displayName: vol.name, createdAt: Date.now(),
        } as UserProfile);
        await createVolunteerProfile({ ...vol, volunteerId: uid, createdAt: Date.now() });
      } catch (err: any) {
        volIds.push(`vol_${SEED_VOLUNTEERS.indexOf(vol)}`);
      }
    }

    setProgress('Creating communities...');
    const communityIds: string[] = [];
    for (const c of SEED_COMMUNITIES) {
      const id = await createCommunity({
        name: c.name,
        location: c.location,
        locationText: `${c.district}, ${c.state}`,
        district: c.district,
        state: c.state,
        pinCode: c.pinCode,
        populationApprox: c.populationApprox,
        areaType: c.areaType,
      });
      communityIds.push(id);
    }

    setProgress('Creating field reports...');
    for (const r of SEED_REPORTS) {
      const communityId = communityIds[r.communityIdx];
      const ngoId = ngoIds[r.ngoIdx] || 'unknown';
      const community = SEED_COMMUNITIES[r.communityIdx];
      const ngo = SEED_NGOS[r.ngoIdx];

      await createReport({
        communityId,
        communityName: community.name,
        ngoId,
        ngoName: ngo.orgName,
        fieldWorkerName: r.fieldWorker,
        needCategory: r.category,
        description: r.description,
        peopleAffected: r.peopleAffected,
        currentResources: r.resources,
        urgencyScore: r.urgency,
        manualUrgency: r.urgency,
        sourceType: 'manual',
        dateOfSurvey: '2026-04-10',
        status: 'pending',
      });
    }

    setProgress('');
    setStep('done');
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 font-bold text-2xl text-primary mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="text-white w-5 h-5" />
            </div>
            ImpactAI
          </div>
          <p className="text-sm text-slate">Admin Setup & Demo Data</p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          {step === 'admin' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Step 1: Create Admin Account</h2>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-danger text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <form onSubmit={createAdmin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Admin Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" placeholder="Min 6 characters" />
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700">
                  Create Admin Account
                </button>
              </form>
            </>
          )}

          {step === 'seeding' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Step 2: Seed Demo Data</h2>
              </div>

              {adminCreated && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 text-success text-sm rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Admin account created!
                </div>
              )}

              <p className="text-sm text-slate mb-4">
                This will populate the database with realistic demo data: 7 communities, 15 field reports, 3 NGOs, and 10 volunteers.
              </p>

              {progress && (
                <div className="mb-4 p-3 bg-blue-50 text-primary text-sm rounded-lg flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  {progress}
                </div>
              )}

              <button onClick={seedData} disabled={!!progress} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black disabled:opacity-50">
                {progress ? 'Seeding...' : 'Seed Demo Data'}
              </button>

              <button onClick={() => navigate('/admin')} className="w-full py-2 mt-2 text-sm text-primary font-semibold hover:underline">
                Skip — go to dashboard
              </button>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold mb-2">Setup Complete!</h2>
              <p className="text-sm text-slate mb-6">
                Admin account + demo data created. You're ready to explore the platform.
              </p>
              <button onClick={() => navigate('/admin')} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700">
                Go to Command Center
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
