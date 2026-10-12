import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getSubscriptionRequest(uid) {
  const snapshot = await getDoc(doc(db, 'subscription_requests', uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function submitSubscriptionRequest(user, fields) {
  const ref = doc(db, 'subscription_requests', user.uid);
  await runTransaction(db, async transaction => {
    const existing = await transaction.get(ref);
    if (existing.exists()) return;
    transaction.set(ref, { userId: user.uid, email: user.email,
      name: fields.name.trim(), organization: fields.organization.trim(), message: fields.message.trim(),
      status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  return getSubscriptionRequest(user.uid);
}
