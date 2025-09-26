
import { db } from '@/lib/firebase';
import type { MeatStockItem, MeatStockLog } from '@/lib/types';
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    doc, 
    updateDoc, 
    deleteDoc, 
    orderBy,
    serverTimestamp,
    Timestamp,
    runTransaction,
    writeBatch,
    where,
    getDocs,
    getDoc,
    increment
} from 'firebase/firestore';

const meatStockCollectionRef = collection(db, 'meatStockItems');
const meatStockLogCollectionRef = collection(db, 'meatStockLogs');

export const listenToMeatStockItems = (callback: (items: MeatStockItem[]) => void) => {
    const q = query(meatStockCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: MeatStockItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                ...data,
                expiryDate: (data.expiryDate as Timestamp)?.toDate() || null,
                createdAt: (data.createdAt as Timestamp)?.toDate()
            } as MeatStockItem);
        });
        callback(items);
    });
    return unsubscribe;
};

export const listenToMeatStockItem = (id: string, callback: (item: MeatStockItem | null) => void) => {
    const itemDocRef = doc(db, 'meatStockItems', id);
    const unsubscribe = onSnapshot(itemDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            callback({
                id: docSnapshot.id,
                ...data,
                expiryDate: (data.expiryDate as Timestamp)?.toDate() || null,
                createdAt: (data.createdAt as Timestamp)?.toDate()
            } as MeatStockItem);
        } else {
            callback(null);
        }
    });
    return unsubscribe;
};

export const listenToAllMeatStockLogs = (callback: (logs: MeatStockLog[]) => void) => {
    const q = query(meatStockLogCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logs: MeatStockLog[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            logs.push({
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date()
            } as MeatStockLog);
        });
        callback(logs);
    });
    return unsubscribe;
};


export const listenToMeatStockLogs = (itemId: string, callback: (logs: any[]) => void) => {
    const q = query(
        meatStockLogCollectionRef, 
        where("itemId", "==", itemId), 
        orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logs: any[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            logs.push({
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date()
            });
        });
        callback(logs);
    });
    return unsubscribe;
};

export const addMeatStockItem = async (item: Omit<MeatStockItem, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(meatStockCollectionRef, {
        ...item,
        expiryDate: item.expiryDate ? Timestamp.fromDate(item.expiryDate) : null,
        createdAt: serverTimestamp()
    });

    if (item.currentStock > 0) {
        await addDoc(meatStockLogCollectionRef, {
            itemId: docRef.id,
            change: item.currentStock,
            newStock: item.currentStock,
            type: 'stock-in',
            detail: 'Initial stock',
            createdAt: serverTimestamp()
        });
    }

    return docRef.id;
};


export const updateMeatStockItem = async (id: string, updatedFields: Partial<Omit<MeatStockItem, 'id' | 'createdAt'>>) => {
    const itemDoc = doc(db, 'meatStockItems', id);
    const dataToUpdate: any = { ...updatedFields };

    if (updatedFields.expiryDate && updatedFields.expiryDate instanceof Date) {
        dataToUpdate.expiryDate = Timestamp.fromDate(updatedFields.expiryDate as Date);
    } else if (updatedFields.expiryDate === null) {
        dataToUpdate.expiryDate = null;
    }

    await updateDoc(itemDoc, dataToUpdate);
};

export const deleteMeatStockItem = async (id: string) => {
    const batch = writeBatch(db);
    
    // Delete item
    batch.delete(doc(db, 'meatStockItems', id));

    // Delete logs
    const logsQuery = query(meatStockLogCollectionRef, where("itemId", "==", id));
    const logsSnapshot = await getDocs(logsQuery);
    logsSnapshot.forEach(logDoc => batch.delete(logDoc.ref));

    await batch.commit();
};

export const updateStockQuantity = async (id: string, change: number, type: 'stock-in' | 'sale', detail: string) => {
    const itemDocRef = doc(db, 'meatStockItems', id);

    await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemDocRef);
        if (!itemDoc.exists()) {
            throw new Error("Item does not exist!");
        }

        const newStock = itemDoc.data().currentStock + change;
        if (newStock < 0) {
            throw new Error("Stock cannot be negative!");
        }

        transaction.update(itemDocRef, { currentStock: newStock });

        const logRef = doc(meatStockLogCollectionRef);
        transaction.set(logRef, {
            itemId: id,
            change: change,
            newStock: newStock,
            type: type,
            detail: detail,
            createdAt: serverTimestamp()
        });
    });
};

export const deleteMeatStockLog = async (logId: string, itemId: string) => {
     return runTransaction(db, async (transaction) => {
        const logDocRef = doc(meatStockLogCollectionRef, logId);
        const logDoc = await transaction.get(logDocRef);
        if (!logDoc.exists()) {
            throw "Log entry not found.";
        }

        const itemDocRef = doc(meatStockCollectionRef, itemId);
        const logData = logDoc.data();
        const changeToReverse = -logData.change;

        // Update the item's stock level.
        transaction.update(itemDocRef, { currentStock: increment(changeToReverse) });

        // Now, delete the log entry.
        transaction.delete(logDocRef);
    });
};

export const updateMeatStockLog = async (logId: string, itemId: string, updates: { change: number, detail: string }) => {
     return runTransaction(db, async (transaction) => {
        const logDocRef = doc(meatStockLogCollectionRef, logId);
        const itemDocRef = doc(meatStockCollectionRef, itemId);

        const logDoc = await transaction.get(logDocRef);
        if (!logDoc.exists()) {
            throw "Log entry not found.";
        }

        const originalLog = logDoc.data();
        const oldChange = originalLog.change;
        
        const newChangeValue = originalLog.type === 'sale' 
            ? -Math.abs(updates.change) 
            : Math.abs(updates.change);
        
        const difference = newChangeValue - oldChange;

        // Update the item stock with the difference.
        transaction.update(itemDocRef, { currentStock: increment(difference) });

        // Update the log entry with the new values.
        transaction.update(logDocRef, { 
            change: newChangeValue,
            detail: updates.detail,
            newStock: increment(difference) // newStock in the log is also adjusted by the difference.
        });
    });
};


export const getAllMeatStockItemIds = async (): Promise<{ id: string }[]> => {
    const q = query(meatStockCollectionRef);
    const querySnapshot = await getDocs(q);
    const ids = querySnapshot.docs.map(doc => ({ id: doc.id }));
    if (ids.length === 0) {
        return [{ id: 'default' }];
    }
    return ids;
};

export const getMeatStockItem = async (id: string): Promise<MeatStockItem | null> => {
    const docRef = doc(db, 'meatStockItems', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            expiryDate: (data.expiryDate as Timestamp)?.toDate(),
            createdAt: (data.createdAt as Timestamp)?.toDate(),
        } as MeatStockItem;
    } else {
        return null;
    }
}
