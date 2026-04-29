'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  treatments?: string[];
}

export async function registerCustomer(data: CustomerData) {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...data,
      points: 0,
      createdAt: serverTimestamp(),
      lastVisit: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error registering customer:", error);
    throw error;
  }
}
