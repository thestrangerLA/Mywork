

import { db } from '@/lib/firebase';
import type { SavedCalculation, CalculationSnapshot } from '@/lib/types';
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
    getDoc,
    getDocs,
    arrayUnion
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';


const calculationsCollectionRef = collection(db, 'tourCalculations');

// Helper to convert Firestore timestamps in nested objects to JS Dates
const convertTimestampsToDates = (data: any): any => {
    if (!data) return data;
    
    if (data instanceof Timestamp) {
        return data.toDate();
    }
    
    if (Array.isArray(data)) {
        return data.map(item => convertTimestampsToDates(item));
    }
    
    if (typeof data === 'object' && data !== null && !Array.isArray(data) && Object.keys(data).length > 0) {
        const newData: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newData[key] = convertTimestampsToDates(data[key]);
            }
        }
        return newData;
    }
    
    return data;
};


// Helper to convert JS Dates to Firestore Timestamps for writing
const convertDatesToTimestamps = (data: any): any => {
    if (!data) return data;
    
    if (data instanceof Date) {
        return Timestamp.fromDate(data);
    }
    
    if (Array.isArray(data)) {
        return data.map(item => convertDatesToTimestamps(item));
    }
    
    if (typeof data === 'object' && data !== null && !Array.isArray(data) && Object.keys(data).length > 0) {
        const newData: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newData[key] = convertDatesToTimestamps(data[key]);
            }
        }
        return newData;
    }
    
    return data;
};


export const listenToSavedCalculations = (callback: (items: SavedCalculation[]) => void) => {
    const q = query(calculationsCollectionRef, orderBy('savedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: SavedCalculation[] = [];
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const convertedData = convertTimestampsToDates(data);
            items.push({
                id: docSnapshot.id,
                ...convertedData,
            } as SavedCalculation);
        });
        callback(items);
    }, (error) => {
        console.error('Error listening to saved calculations:', error);
        callback([]);
    });
    
    return unsubscribe;
};

export const getCalculation = async (id: string): Promise<SavedCalculation | null> => {
    try {
        const docRef = doc(calculationsCollectionRef, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            const convertedData = convertTimestampsToDates(data);
            // Ensure history is an array
            if (!convertedData.history) {
                convertedData.history = [];
            }
            return { id: docSnap.id, ...convertedData } as SavedCalculation;
        }
        return null;
    } catch (error) {
        console.error('Error getting calculation:', error);
        throw error;
    }
};

export const getAllCalculations = async (): Promise<SavedCalculation[]> => {
    const q = query(calculationsCollectionRef);
    const querySnapshot = await getDocs(q);
    const calculations: SavedCalculation[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        calculations.push({
             id: doc.id,
            ...convertTimestampsToDates(data),
        } as SavedCalculation)
    });
    return calculations;
}

export const saveCalculation = async (calculation: Omit<SavedCalculation, 'id'| 'savedAt' | 'history'>): Promise<string> => {
    try {
        const dataToSave = convertDatesToTimestamps(calculation);
        
        const docRef = await addDoc(calculationsCollectionRef, {
            ...dataToSave,
            history: [],
            savedAt: serverTimestamp()
        });
        
        return docRef.id;
    } catch (error) {
        console.error('Error saving calculation:', error);
        throw error;
    }
};

export const addCalculationToHistory = async (id: string, snapshotData: Omit<CalculationSnapshot, 'id' | 'savedAt'>): Promise<void> => {
    try {
        const docRef = doc(calculationsCollectionRef, id);

        const newSnapshot: CalculationSnapshot = {
            id: uuidv4(),
            savedAt: new Date(),
            ...snapshotData
        };

        const snapshotForFirestore = convertDatesToTimestamps(newSnapshot);

        await updateDoc(docRef, {
            history: arrayUnion(snapshotForFirestore),
            // Also update the main document to reflect the latest state
            tourInfo: snapshotForFirestore.tourInfo,
            allCosts: snapshotForFirestore.allCosts,
            savedAt: serverTimestamp() // Update savedAt timestamp
        });
    } catch (error) {
        console.error('Error adding calculation to history:', error);
        throw error;
    }
}


export const updateCalculation = async (id: string, updates: Partial<Omit<SavedCalculation, 'id'>>): Promise<void> => {
    try {
        const docRef = doc(calculationsCollectionRef, id);
        const dataToUpdate = convertDatesToTimestamps(updates);
        
        await updateDoc(docRef, {
            ...dataToUpdate,
            savedAt: serverTimestamp() // Effectively "updated at"
        });
    } catch (error) {
        console.error('Error updating calculation:', error);
        throw error;
    }
};

export const deleteCalculation = async (id: string): Promise<void> => {
    try {
        const docRef = doc(calculationsCollectionRef, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting calculation:', error);
        throw error;
    }
};
