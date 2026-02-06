/**
 * Data Management System for Britanika 2K26
 */

class DataManager {
    static async fetchData(type) {
        try {
            const response = await fetch(`data/${type}.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const jsonData = await response.json();
            
            // Merge with local storage data if exists
            const localData = JSON.parse(localStorage.getItem(`bec_britanika_${type}`)) || [];
            
            // For simple simulation, we'll prefix local data to JSON data
            // In a real system, you'd match IDs and update
            return [...localData, ...jsonData];
        } catch (error) {
            console.error("Could not fetch data:", error);
            // Fallback to local storage if network fails
            return JSON.parse(localStorage.getItem(`bec_britanika_${type}`)) || [];
        }
    }

    static async getSports() {
        return await this.fetchData('sports');
    }

    static async getCultural() {
        return await this.fetchData('cultural');
    }

    static async getOtherEvents() {
        return await this.fetchData('other-events');
    }

    static async getUpdates() {
        return await this.fetchData('updates');
    }

    static saveLocalData(type, newData) {
        const existingData = JSON.parse(localStorage.getItem(`bec_britanika_${type}`)) || [];
        existingData.unshift(newData); // Add new entry to the top
        localStorage.setItem(`bec_britanika_${type}`, JSON.stringify(existingData));
    }
}

window.DataManager = DataManager;
