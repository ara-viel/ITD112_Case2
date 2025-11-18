import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const originCollection = collection(db, "orig");

// CREATE
export const addOrigin = async (data) => {
  await addDoc(originCollection, data);
};

// READ
export const getOrigin = async () => {
  const snapshot = await getDocs(originCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateOrigin = async (id, data) => {
  const docRef = doc(db, "orig", id);
  await updateDoc(docRef, data);
};

// DELETE
export const deleteOrigin = async (id) => {
  const docRef = doc(db, "orig", id);
  await deleteDoc(docRef);
};

// DELETE ALL
export const deleteAllOrigin = async () => {
  const snapshot = await getDocs(originCollection);
  const deletePromises = snapshot.docs.map((docItem) => deleteDoc(doc(db, "orig", docItem.id)));
  await Promise.all(deletePromises);
};
