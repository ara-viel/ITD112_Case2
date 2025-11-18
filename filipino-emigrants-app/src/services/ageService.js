import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const ageCollection = collection(db, "age");

// CREATE
export const addAge = async (data) => {
  await addDoc(ageCollection, data);
};

// READ
export const getAge = async () => {
  const snapshot = await getDocs(ageCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateAge = async (id, data) => {
  const docRef = doc(db, "age", id);
  await updateDoc(docRef, data);
};

// DELETE
export const deleteAge = async (id) => {
  const docRef = doc(db, "age", id);
  await deleteDoc(docRef);
};

// DELETE ALL
export const deleteAllAge = async () => {
  const snapshot = await getDocs(ageCollection);
  const deletePromises = snapshot.docs.map((docItem) => deleteDoc(doc(db, "age", docItem.id)));
  await Promise.all(deletePromises);
};