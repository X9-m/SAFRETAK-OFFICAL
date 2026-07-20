import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, getDoc, getDocs, collection, deleteDoc, runTransaction } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Booking } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

let isOfflineMode = false;

// Default bookings array to seed if empty in offline mode
const OFFLINE_DEFAULT_BOOKINGS: Booking[] = [];

export async function ensureAuth(): Promise<User> {
  if (isOfflineMode) {
    return { uid: 'offline_user', isAnonymous: true } as User;
  }
  if (auth.currentUser) {
    return auth.currentUser;
  }
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      }
    });
    signInAnonymously(auth)
      .then((userCredential) => {
        unsubscribe();
        resolve(userCredential.user);
      })
      .catch((err) => {
        console.warn("Firebase Anonymous Sign-In is restricted or disabled. Activating robust localStorage fallback mode:", err);
        isOfflineMode = true;
        unsubscribe();
        resolve({ uid: 'offline_user', isAnonymous: true } as User);
      });
  });
}

export async function clearDatabase(): Promise<void> {
  if (isOfflineMode) {
    localStorage.removeItem('safretak_bookings');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('safretak_user_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    console.log("Local storage fallback database cleared.");
    return;
  }

  try {
    const collectionsToClear = ['bookings', 'users', 'complaints', 'reviews', 'services', 'travel_offices'];
    for (const colName of collectionsToClear) {
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, colName, docSnap.id));
      }
    }
    console.log("Firestore database cleared successfully.");
  } catch (err) {
    console.error("Failed to clear database: ", err);
    throw err;
  }
}

async function testConnection() {
  try {
    await ensureAuth();
    if (isOfflineMode) {
      console.log("Firestore connection test bypassed: Running in localStorage fallback mode.");
      return;
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test completed successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Durable database helpers
export async function saveUserToDb(userId: string, fullName: string, phone: string, role: string, email?: string) {
  const data = {
    id: userId,
    fullName,
    phone,
    role,
    email: email || '',
    createdAt: new Date().toISOString()
  };

  if (isOfflineMode) {
    try {
      localStorage.setItem(`safretak_user_${userId}`, JSON.stringify(data));
      return data;
    } catch (e) {
      console.error("Local storage error in saveUserToDb:", e);
      return data;
    }
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, data);
    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${userId}`);
  }
}

export async function getUserFromDb(userId: string) {
  if (isOfflineMode) {
    try {
      const u = localStorage.getItem(`safretak_user_${userId}`);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      console.error("Local storage error in getUserFromDb:", e);
      return null;
    }
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
  }
}

export async function saveBookingToDb(booking: Booking) {
  if (isOfflineMode) {
    try {
      const bookingsStr = localStorage.getItem('safretak_bookings');
      let bookings: Booking[] = bookingsStr ? JSON.parse(bookingsStr) : [...OFFLINE_DEFAULT_BOOKINGS];
      const index = bookings.findIndex(b => b.id === booking.id);
      if (index >= 0) {
        bookings[index] = booking;
      } else {
        bookings.push(booking);
      }
      localStorage.setItem('safretak_bookings', JSON.stringify(bookings));
      return;
    } catch (e) {
      console.error("Local storage error in saveBookingToDb:", e);
      return;
    }
  }

  try {
    const bookingDocRef = doc(db, 'bookings', booking.id);
    await setDoc(bookingDocRef, booking);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `bookings/${booking.id}`);
  }
}

export async function getBookingsFromDb() {
  if (isOfflineMode) {
    try {
      const bookingsStr = localStorage.getItem('safretak_bookings');
      if (!bookingsStr) {
        localStorage.setItem('safretak_bookings', JSON.stringify(OFFLINE_DEFAULT_BOOKINGS));
        return OFFLINE_DEFAULT_BOOKINGS;
      }
      return JSON.parse(bookingsStr) as Booking[];
    } catch (e) {
      console.error("Local storage error in getBookingsFromDb:", e);
      return OFFLINE_DEFAULT_BOOKINGS;
    }
  }

  try {
    const bookingsCol = collection(db, 'bookings');
    const snap = await getDocs(bookingsCol);
    const list: Booking[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as Booking);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'bookings');
  }
}

export async function updateBookingInDb(booking: Booking) {
  if (isOfflineMode) {
    await saveBookingToDb(booking);
    return;
  }

  try {
    const bookingDocRef = doc(db, 'bookings', booking.id);
    await setDoc(bookingDocRef, booking);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${booking.id}`);
  }
}

/**
 * Real-time transaction to book seats for trips/Hajj/Umrah, resolving the race condition.
 */
export async function bookServiceSeats(
  booking: Booking,
  serviceId: string,
  serviceType: string,
  requestedSeats: number,
  initialSeats: number,
  serviceTitle: string
): Promise<void> {
  if (isOfflineMode) {
    // Standard local catalog management in fallback mode
    if (serviceType === 'trip' || serviceType === 'intl_trip') {
      const saved = localStorage.getItem('safretak_trips_catalog');
      let catalog: any[] = [];
      if (saved) {
        try {
          catalog = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
      const itemIndex = catalog.findIndex((x: any) => x.id === serviceId);
      if (itemIndex >= 0) {
        const item = catalog[itemIndex];
        const currentSeats = typeof item.seatsRemaining === 'number' ? item.seatsRemaining : initialSeats;
        if (currentSeats < requestedSeats) {
          throw new Error('NOT_ENOUGH_SEATS');
        }
        item.seatsRemaining = currentSeats - requestedSeats;
        localStorage.setItem('safretak_trips_catalog', JSON.stringify(catalog));
      } else {
        if (initialSeats < requestedSeats) {
          throw new Error('NOT_ENOUGH_SEATS');
        }
      }
    } else if (serviceType === 'hajj_umrah') {
      const saved = localStorage.getItem('safretak_hajj_umrah_catalog');
      let catalog: any[] = [];
      if (saved) {
        try {
          catalog = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
      const itemIndex = catalog.findIndex((x: any) => x.id === serviceId);
      if (itemIndex >= 0) {
        const item = catalog[itemIndex];
        const currentSeats = typeof item.seatsRemaining === 'number' ? item.seatsRemaining : initialSeats;
        if (currentSeats < requestedSeats) {
          throw new Error('NOT_ENOUGH_SEATS');
        }
        item.seatsRemaining = currentSeats - requestedSeats;
        localStorage.setItem('safretak_hajj_umrah_catalog', JSON.stringify(catalog));
      } else {
        if (initialSeats < requestedSeats) {
          throw new Error('NOT_ENOUGH_SEATS');
        }
        const newItem = { id: serviceId, seatsRemaining: initialSeats - requestedSeats };
        catalog.push(newItem);
        localStorage.setItem('safretak_hajj_umrah_catalog', JSON.stringify(catalog));
      }
    }

    await saveBookingToDb(booking);
    return;
  }

  // ONLINE MODE - Atomic Firestore transaction to completely eliminate booking collisions (race conditions)
  try {
    const serviceDocRef = doc(db, 'services', serviceId);
    const bookingDocRef = doc(db, 'bookings', booking.id);

    await runTransaction(db, async (transaction) => {
      const serviceSnap = await transaction.get(serviceDocRef);
      let seatsRemaining = initialSeats;

      if (serviceSnap.exists()) {
        const data = serviceSnap.data();
        if (data && typeof data.seatsRemaining === 'number') {
          seatsRemaining = data.seatsRemaining;
        }
      } else {
        // Create initial placeholder in database if first time accessed
        transaction.set(serviceDocRef, {
          id: serviceId,
          type: serviceType,
          title: serviceTitle,
          seatsRemaining: initialSeats,
          createdAt: new Date().toISOString()
        });
      }

      if (seatsRemaining < requestedSeats) {
        throw new Error('NOT_ENOUGH_SEATS');
      }

      const updatedSeats = seatsRemaining - requestedSeats;
      transaction.update(serviceDocRef, {
        seatsRemaining: updatedSeats,
        updatedAt: new Date().toISOString()
      });

      // Atomically write booking inside the transaction
      transaction.set(bookingDocRef, booking);
    });
  } catch (err: any) {
    if (err && err.message === 'NOT_ENOUGH_SEATS') {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `services/${serviceId} & bookings/${booking.id}`);
  }
}

/**
 * Dynamic catalog fetch to merge real-time Firestore seat balances into UI representations.
 */
export async function getAllServiceSeats(): Promise<Record<string, number>> {
  if (isOfflineMode) {
    const seats: Record<string, number> = {};
    // Load trips seats from local storage
    try {
      const savedTrips = localStorage.getItem('safretak_trips_catalog');
      if (savedTrips) {
        const catalog = JSON.parse(savedTrips);
        catalog.forEach((item: any) => {
          if (item.id && typeof item.seatsRemaining === 'number') {
            seats[item.id] = item.seatsRemaining;
          }
        });
      }
      const savedHajj = localStorage.getItem('safretak_hajj_umrah_catalog');
      if (savedHajj) {
        const catalog = JSON.parse(savedHajj);
        catalog.forEach((item: any) => {
          if (item.id && typeof item.seatsRemaining === 'number') {
            seats[item.id] = item.seatsRemaining;
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
    return seats;
  }

  try {
    const servicesCol = collection(db, 'services');
    const snap = await getDocs(servicesCol);
    const seatsMap: Record<string, number> = {};
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.id && typeof data.seatsRemaining === 'number') {
        seatsMap[data.id] = data.seatsRemaining;
      }
    });
    return seatsMap;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'services');
    return {};
  }
}


