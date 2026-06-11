import { updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, db, storage } from '../firebase'

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the profile image.'))
    reader.readAsDataURL(file)
  })
}

async function uploadProfilePhoto(user, photoFile) {
  const isLocalDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'

  if (isLocalDevelopment) {
    return {
      photoURL: await readImageAsDataUrl(photoFile),
      photoStorage: 'firestore-local-fallback',
    }
  }

  const safeName = photoFile.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()
  const photoRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}-${safeName}`)

  try {
    await uploadBytes(photoRef, photoFile)
    return {
      photoURL: await getDownloadURL(photoRef),
      photoStorage: 'storage',
    }
  } catch (error) {
    const isCorsOrNetworkError =
      error.code === 'storage/unknown' ||
      error.message?.toLowerCase().includes('cors') ||
      error.message?.toLowerCase().includes('network')

    if (!isCorsOrNetworkError) {
      throw error
    }

    return {
      photoURL: await readImageAsDataUrl(photoFile),
      photoStorage: 'firestore-fallback',
    }
  }
}

export async function updateUserProfile(user, profileData, photoFile) {
  if (!user || !db) {
    throw new Error('Sign in before updating your profile.')
  }

  let photoURL = profileData.photoURL || user.photoURL || ''
  let photoStorage = profileData.photoStorage || 'none'

  if (photoFile) {
    if (!storage) {
      throw new Error('Firebase Storage is not configured.')
    }

    if (!photoFile.type.startsWith('image/')) {
      throw new Error('Upload a valid profile image.')
    }

    const uploadedPhoto = await uploadProfilePhoto(user, photoFile)
    photoURL = uploadedPhoto.photoURL
    photoStorage = uploadedPhoto.photoStorage
  }

  const nextProfile = {
    name: profileData.name.trim(),
    email: user.email || profileData.email || '',
    phone: profileData.phone.trim(),
    address: profileData.address.trim(),
    photoURL,
    photoStorage,
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'users', user.uid), nextProfile, { merge: true })

  if (auth?.currentUser) {
    const authProfileUpdates = {
      displayName: nextProfile.name,
    }

    if (photoStorage === 'storage') {
      authProfileUpdates.photoURL = photoURL
    }

    await updateProfile(auth.currentUser, authProfileUpdates)
  }

  return nextProfile
}
