import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

initializeApp()

const db = getFirestore()

export const deleteCustomerAccount = onCall(async (request) => {
  const callerUid = request.auth?.uid
  const userId = request.data?.userId

  if (!callerUid) {
    throw new HttpsError('unauthenticated', 'Sign in as an admin first.')
  }

  if (!userId || typeof userId !== 'string') {
    throw new HttpsError('invalid-argument', 'A valid user id is required.')
  }

  if (userId === callerUid) {
    throw new HttpsError('failed-precondition', 'You cannot delete your own admin account.')
  }

  const callerProfile = await db.collection('users').doc(callerUid).get()

  if (callerProfile.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can delete customer accounts.')
  }

  const customerRef = db.collection('users').doc(userId)
  const customerProfile = await customerRef.get()

  if (!customerProfile.exists) {
    throw new HttpsError('not-found', 'Customer record was not found.')
  }

  if ((customerProfile.data()?.role || 'customer').toLowerCase() !== 'customer') {
    throw new HttpsError('failed-precondition', 'Only customer accounts can be deleted here.')
  }

  await deleteAuthUser(userId)
  await Promise.all([
    db.recursiveDelete(customerRef),
    db.recursiveDelete(db.collection('carts').doc(userId)),
  ])

  return { deleted: true }
})

async function deleteAuthUser(userId) {
  try {
    await getAuth().deleteUser(userId)
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error
    }
  }
}
