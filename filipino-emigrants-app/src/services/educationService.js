import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const educCollection = collection(db, "education");

// CREATE
export const addEduc = async (data) => {
  await addDoc(educCollection, data);
};

// READ
export const getEduc = async () => {
  const snapshot = await getDocs(educCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateEduc = async (id, data) => {
  const docRef = doc(db, "education", id);
  await updateDoc(docRef, data);
};

// DELETE
export const deleteEduc = async (id) => {
  const docRef = doc(db, "education", id);
  await deleteDoc(docRef);
};
// DELETE ALL
export const deleteAllEduc = async () => {
  const snapshot = await getDocs(educCollection);
  const deletePromises = snapshot.docs.map((docItem) => deleteDoc(doc(db, "education", docItem.id)));
  await Promise.all(deletePromises);
};