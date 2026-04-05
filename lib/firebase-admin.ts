import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    console.log('Firebase Admin initialized successfully')
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
  }
}

export const adminAuth = admin.auth()
export const adminDb = admin.firestore()
export const adminStorage = admin.storage()

export default admin
