import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const occuCollection = collection(db, "occupation");

// CREATE
export const addOccu = async (data) => {
  await addDoc(occuCollection, data);
};

// READ
export const getOccu = async () => {
  const snapshot = await getDocs(occuCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateOccu = async (id, data) => {
  const docRef = doc(db, "occupation", id);
  await updateDoc(docRef, data);
};

// DELETE
export const deleteOccu = async (id) => {
  const docRef = doc(db, "occupation", id);
  await deleteDoc(docRef);
};

// DELETE ALL
export const deleteAllOccu = async () => {
  const snapshot = await getDocs(occuCollection);
  const deletePromises = snapshot.docs.map((docItem) => deleteDoc(doc(db, "occupation", docItem.id)));
  await Promise.all(deletePromises);
};