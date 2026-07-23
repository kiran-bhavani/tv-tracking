import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export async function logActivity(showId: number, showName: string, seasonNumber: number, episodeNumber: number, episodeName: string) {
  if (!auth.currentUser) return; // Only log if logged in

  try {
    await addDoc(collection(db, 'activityFeed'), {
      userId: auth.currentUser.uid,
      userDisplayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
      showId,
      showName,
      seasonNumber,
      episodeNumber,
      episodeName,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
