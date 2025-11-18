import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const emigrantsCollection = collection(db, "civilStatus");

// CREATE
export const addEmigrant = async (data) => {
  await addDoc(emigrantsCollection, data);
};

// READ
export const getEmigrants = async () => {
  const snapshot = await getDocs(emigrantsCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateEmigrant = async (id, data) => {
  const docRef = doc(db, "civilStatus", id);
  await updateDoc(docRef, data);
};

// DELETE
export const deleteEmigrant = async (id) => {
  const docRef = doc(db, "civilStatus", id);
  await deleteDoc(docRef);
};

// DELETE ALL
export const deleteAllEmigrant = async () => {
  const snapshot = await getDocs(emigrantsCollection);
  const deletePromises = snapshot.docs.map((docItem) => deleteDoc(doc(db, "civilStatus", docItem.id)));
  await Promise.all(deletePromises);
};