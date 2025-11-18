import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const sexCollection = collection(db, "sex");

// CREATE
export const addSex = async (data) => {
  await addDoc(sexCollection, data);
};

// READ
export const getSex = async () => {
  const snapshot = await getDocs(sexCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateSex = async (id, data) => {
  const docRef = doc(db, "sex", id);
  await updateDoc(docRef, data);
};

// DELETE
export const deleteSex = async (id) => {
  const docRef = doc(db, "sex", id);
  await deleteDoc(docRef);
};

// DELETE ALL
export const deleteAllSex = async () => {
  const snapshot = await getDocs(sexCollection);
  const deletePromises = snapshot.docs.map((docItem) => deleteDoc(doc(db, "sex", docItem.id)));
  await Promise.all(deletePromises);
};