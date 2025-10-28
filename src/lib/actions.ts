
"use client";

import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
  writeBatch,
  setDoc,
  Firestore,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import type { Item, SessionItem } from './types';
import { placeholderItems } from './placeholder-data';

export async function createUserProfile(firestore: Firestore, uid: string, email: string) {
    try {
        const userRef = doc(firestore, 'users', uid);
        await setDoc(userRef, {
            uid,
            email,
            createdAt: serverTimestamp(),
            role: 'cashier', // All new users are cashiers by default
        });
        return { success: true };
    } catch (error) {
        console.error("Error creating user profile:", error);
        return { error: 'Failed to create user profile.' };
    }
}

export async function startSession(firestore: Firestore, name: string) {
  if (!name.trim()) {
    return { error: 'Customer name cannot be empty.' };
  }
  try {
    await addDoc(collection(firestore, 'sessions'), {
      name: name.trim(),
      entryTime: serverTimestamp(),
      exitTime: null,
      status: 'active',
      items: [],
      totalCost: 0,
      discount: 0,
      finalAmount: 0,
      paymentMethod: null,
      durationMinutes: 0,
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to start session.' };
  }
}

export async function checkoutSession(firestore: Firestore, sessionId: string, totalCost: number, discount: number, finalAmount: number, paymentMethod: 'cash' | 'instapay', durationMinutes: number) {
  try {
    const sessionRef = doc(firestore, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      status: 'completed',
      exitTime: serverTimestamp(),
      totalCost,
      discount,
      finalAmount,
      paymentMethod,
      durationMinutes,
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to checkout session.' };
  }
}

export async function cancelSession(firestore: Firestore, sessionId: string) {
  try {
    const sessionRef = doc(firestore, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      status: 'cancelled',
      exitTime: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to cancel session.' };
  }
}


export async function addItemToSession(firestore: Firestore, sessionId: string, sessionItems: any[], item: Item, quantity: number) {
  try {
    const sessionRef = doc(firestore, 'sessions', sessionId);
    const existingItemIndex = sessionItems.findIndex(i => i.itemId === item.id);
    let newItems = [...sessionItems];

    if (existingItemIndex > -1) {
      newItems[existingItemIndex].quantity += quantity;
    } else {
      newItems.push({
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: quantity,
      });
    }

    await updateDoc(sessionRef, {
      items: newItems,
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to add item.' };
  }
}

export async function updateSessionItems(firestore: Firestore, sessionId: string, items: SessionItem[]) {
  try {
    const sessionRef = doc(firestore, 'sessions', sessionId);
    await updateDoc(sessionRef, { items });
    return { success: true };
  } catch (error) {
    console.error('Error updating session items:', error);
    return { error: 'Failed to update items.' };
  }
}

export async function createItem(firestore: Firestore, name: string, price: number) {
  if (!name.trim() || price < 0) {
    return { error: 'Invalid item name or price.' };
  }
  try {
    await addDoc(collection(firestore, 'items'), {
      name: name.trim(),
      price: price,
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create item.' };
  }
}

export async function updateItem(firestore: Firestore, id: string, name: string, price: number) {
  if (!name.trim() || price < 0) {
    return { error: 'Invalid item name or price.' };
  }
  try {
    const itemRef = doc(firestore, 'items', id);
    await updateDoc(itemRef, {
      name: name.trim(),
      price: price,
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update item.' };
  }
}

export async function deleteItem(firestore: Firestore, id: string) {
  try {
    await deleteDoc(doc(firestore, 'items', id));
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete item.' };
  }
}


export async function seedDatabase(firestore: Firestore) {
  try {
    // Check if items already exist to prevent duplicates
    const itemsCollection = collection(firestore, "items");
    const existingItems = await getDocs(itemsCollection);
    if (!existingItems.empty) {
      return { success: 'Database already contains items. Seeding skipped.' };
    }
    
    const batch = writeBatch(firestore);
    placeholderItems.forEach(item => {
      const docRef = doc(collection(firestore, "items"));
      batch.set(docRef, item);
    });
    
    await batch.commit();
    return { success: 'Database seeded successfully.' };
    
  } catch (error) {
    console.error(error);
    return { error: 'Failed to seed database.' };
  }
}


export async function clearAllSessions(firestore: Firestore) {
  try {
    const sessionsRef = collection(firestore, 'sessions');
    const querySnapshot = await getDocs(sessionsRef);
    
    if (querySnapshot.empty) {
      return { success: 'There are no sessions to delete.' };
    }

    const batch = writeBatch(firestore);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return { success: `Successfully deleted ${querySnapshot.size} sessions.` };
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return { error: 'Failed to clear sessions.' };
  }
}
