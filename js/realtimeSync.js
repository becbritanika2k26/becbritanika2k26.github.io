/**
 * RealtimeSync - Universal Data Sync Engine
 * Handles subscriptions and updates for all modules.
 */

import {
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    collection,
    query,
    orderBy,
    addDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./cloudConfig.js";

window.RealtimeSync = {
    /**
     * Subscribe to a single document (e.g., cricket match state)
     */
    subscribeDoc(collPath, docId, callback) {
        const docRef = doc(db, collPath, docId);
        return onSnapshot(docRef, { includeMetadataChanges: true }, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                callback(data);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error(`Sync error on ${collPath}/${docId}:`, error);
        });
    },

    /**
     * Subscribe to a collection (e.g., winners list)
     */
    subscribeCollection(collPath, callback, orderField = 'timestamp', orderDir = 'desc') {
        const collRef = collection(db, collPath);
        const q = query(collRef, orderBy(orderField, orderDir));

        return onSnapshot(q, (querySnapshot) => {
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            callback(data);
        }, (error) => {
            console.error(`Sync error on collection ${collPath}:`, error);
        });
    },

    /**
     * Update or Set a document
     */
    async updateDocument(collPath, docId, data) {
        const docRef = doc(db, collPath, docId);
        try {
            await setDoc(docRef, { ...data, lastUpdated: Date.now() }, { merge: true });
        } catch (error) {
            console.error("Update failed:", error);
            throw error;
        }
    },

    /**
     * Add to collection
     */
    async addToCollection(collPath, data) {
        const collRef = collection(db, collPath);
        try {
            return await addDoc(collRef, { ...data, timestamp: Date.now() });
        } catch (error) {
            console.error("Add failed:", error);
            throw error;
        }
    },

    /**
     * Delete document
     */
    async deleteDocument(collPath, docId) {
        const docRef = doc(db, collPath, docId);
        try {
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Delete failed:", error);
            throw error;
        }
    }
};

export default window.RealtimeSync;
