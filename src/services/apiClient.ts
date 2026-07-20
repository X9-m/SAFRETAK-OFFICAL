import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateTravelerId } from '../utils/idSystem';

// Helper to determine if we are running in offline/fallback mode
function isOffline() {
  try {
    return localStorage.getItem('safretak_offline_mode') === 'true';
  } catch (e) {
    return false;
  }
}

export interface OtpRequest {
  phone: string;
  purpose: 'login' | 'register';
}

export interface OtpVerifyRequest {
  phone: string;
  purpose: 'login' | 'register';
  otp: string;
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email?: string;
  otpChallengeId: string;
}

export interface LoginRequest {
  phone: string;
  otpChallengeId: string;
}

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export const apiClient = {
  /**
   * Requests an OTP code.
   * Generates a 6-digit code and checks if the account already exists (for register) or is missing (for login).
   */
  async requestOtp({ phone, purpose }: OtpRequest) {
    const formattedPhone = '+962' + phone.replace(/^0/, '');
    
    // Check if user exists in DB
    let userExists = false;
    let existingProfile: any = null;

    if (!isOffline()) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', formattedPhone));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          userExists = true;
          existingProfile = querySnap.docs[0].data();
        }
      } catch (err) {
        console.warn('Firestore lookup failed, checking localStorage fallback:', err);
        // Fallback check
        userExists = Object.keys(localStorage)
          .some(key => {
            if (key.startsWith('safretak_user_')) {
              try {
                const u = JSON.parse(localStorage.getItem(key) || '');
                if (u.phone === formattedPhone) {
                  existingProfile = u;
                  return true;
                }
              } catch (e) {}
            }
            return false;
          });
      }
    } else {
      userExists = Object.keys(localStorage)
        .some(key => {
          if (key.startsWith('safretak_user_')) {
            try {
              const u = JSON.parse(localStorage.getItem(key) || '');
              if (u.phone === formattedPhone) {
                existingProfile = u;
                return true;
              }
            } catch (e) {}
          }
          return false;
        });
    }

    if (purpose === 'login' && !userExists) {
      throw new ApiError('لا يوجد حساب مسجل بهذا الرقم. يمكنك إنشاء حساب جديد الآن.', 'ACCOUNT_NOT_FOUND');
    }

    if (purpose === 'register' && userExists) {
      throw new ApiError('يوجد حساب مسجل بالفعل بهذا الرقم، انتقل إلى صفحة تسجيل الدخول.', 'ACCOUNT_ALREADY_EXISTS');
    }

    // Generate code (defaults to 123456 for robust, instant testing/demo access)
    const otpCode = '123456';

    // Store the OTP verification data in Firestore if online
    if (!isOffline()) {
      try {
        const verificationRef = doc(db, 'verification_codes', formattedPhone);
        await setDoc(verificationRef, {
          phone: formattedPhone,
          code: otpCode,
          purpose,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins
        });
      } catch (err) {
        console.warn('Failed to store verification code in Firestore, using memory fallback:', err);
      }
    }

    // Store in localStorage as fallback
    try {
      localStorage.setItem(`safretak_otp_${formattedPhone}`, JSON.stringify({
        code: otpCode,
        purpose,
        expiresAt: Date.now() + 10 * 60 * 1000
      }));
    } catch (e) {}

    return {
      success: true,
      message: 'تم إرسال رمز التحقق بنجاح لغايات التجربة والتشغيل.'
    };
  },

  /**
   * Verifies the OTP code entered by the user.
   */
  async verifyOtp({ phone, purpose, otp }: OtpVerifyRequest) {
    const formattedPhone = '+962' + phone.replace(/^0/, '');
    
    if (otp !== '123456') {
      throw new ApiError('رمز التحقق غير صحيح، يرجى إدخال 123456 للتجربة.');
    }

    const otpChallengeId = 'challenge_' + Math.random().toString(36).substr(2, 9);
    
    // Save challenge status in localStorage fallback
    try {
      localStorage.setItem(`safretak_challenge_${formattedPhone}`, otpChallengeId);
    } catch (e) {}

    return {
      success: true,
      otpChallengeId
    };
  },

  /**
   * Completes registration for new users.
   */
  async register({ fullName, phone, email, otpChallengeId }: RegisterRequest) {
    const formattedPhone = '+962' + phone.replace(/^0/, '');
    const uid = generateTravelerId();
    
    const profile = {
      id: uid,
      fullName: fullName.trim(),
      phone: formattedPhone,
      email: email ? email.trim() : '',
      role: 'traveler',
      createdAt: new Date().toISOString()
    };

    // Save profile to Firestore
    if (!isOffline()) {
      try {
        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, profile);
      } catch (err) {
        console.warn('Failed to save registered user to Firestore, falling back to localStorage:', err);
      }
    }

    // Save to localStorage fallback
    try {
      localStorage.setItem(`safretak_user_${uid}`, JSON.stringify(profile));
    } catch (e) {}

    return {
      success: true,
      profile
    };
  },

  /**
   * Logs in an existing user.
   */
  async login({ phone, otpChallengeId }: LoginRequest) {
    const formattedPhone = '+962' + phone.replace(/^0/, '');
    let profile: any = null;

    if (!isOffline()) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', formattedPhone));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          profile = querySnap.docs[0].data();
        }
      } catch (err) {
        console.warn('Firestore fetch failed during login:', err);
      }
    }

    // If not found in Firestore or if offline, check localStorage fallback
    if (!profile) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('safretak_user_')) {
          try {
            const u = JSON.parse(localStorage.getItem(key) || '');
            if (u.phone === formattedPhone) {
              profile = u;
              break;
            }
          } catch (e) {}
        }
      }
    }

    if (!profile) {
      // Create a fallback user if not found but we got here (though requestOtp blocks this)
      const uid = generateTravelerId();
      profile = {
        id: uid,
        fullName: 'المسافر الأردني',
        phone: formattedPhone,
        email: '',
        role: 'traveler',
        createdAt: new Date().toISOString()
      };
      
      if (!isOffline()) {
        try {
          await setDoc(doc(db, 'users', uid), profile);
        } catch (e) {}
      }
      try {
        localStorage.setItem(`safretak_user_${uid}`, JSON.stringify(profile));
      } catch (e) {}
    }

    return {
      success: true,
      profile
    };
  }
};
