import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const originCollection = collection(db, "destination");

// CREATE
export const addAllCountry = async (data) => {
  await addDoc(originCollection, data);
};

// READ
export const getAllCountries = async () => {
  const snapshot = await getDocs(originCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateAllCountry = async (id, data) => {
  const docRef = doc(db, "destination", id);
  await updateDoc(docRef, data);
};

// DELETE
export const deleteAllCountry = async (id) => {
  const docRef = doc(db, "destination", id);
  await deleteDoc(docRef);
};

// DELETE ALL
export const deleteAllCountries = async () => {
  const snapshot = await getDocs(originCollection);
  const deletePromises = snapshot.docs.map((docItem) => deleteDoc(doc(db, "destination", docItem.id)));
  await Promise.all(deletePromises);
};
