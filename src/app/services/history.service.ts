import { Injectable } from '@angular/core';

export interface HistoryEntry {
  id: string;
  date: string;
  imagePreview: string;
  patientData: any;
  results: any;
  imageQuality?: any;
  expanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly HISTORY_KEY = 'scan_body_history';
  private readonly MAX_HISTORY_ENTRIES = 100; // Limit storage
  
  /**
   * Load history from localStorage
   */
  loadHistory(): HistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored) as HistoryEntry[];
        // Sort by date (most recent first)
        return history.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
    return [];
  }
  
  /**
   * Save history to localStorage
   */
  saveHistory(history: HistoryEntry[]): void {
    try {
      // Limit history size
      const limitedHistory = history.slice(0, this.MAX_HISTORY_ENTRIES);
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving history:', error);
      // If storage is full, try to remove oldest entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        const limitedHistory = history.slice(0, 50);
        try {
          localStorage.setItem(this.HISTORY_KEY, JSON.stringify(limitedHistory));
        } catch (e) {
          console.error('Failed to save reduced history:', e);
        }
      }
    }
  }
  
  /**
   * Add entry to history
   */
  addEntry(entry: HistoryEntry, history: HistoryEntry[]): HistoryEntry[] {
    // Check if entry already exists (avoid duplicates)
    const exists = history.some(h => h.id === entry.id);
    if (exists) {
      return history;
    }
    
    const updated = [entry, ...history];
    this.saveHistory(updated);
    return updated;
  }
  
  /**
   * Delete entry from history
   */
  deleteEntry(id: string, history: HistoryEntry[]): HistoryEntry[] {
    const updated = history.filter(h => h.id !== id);
    this.saveHistory(updated);
    return updated;
  }
  
  /**
   * Clear all history
   */
  clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY);
  }
  
  /**
   * Get entry by ID
   */
  getEntry(id: string, history: HistoryEntry[]): HistoryEntry | undefined {
    return history.find(h => h.id === id);
  }
  
  /**
   * Compare two entries (for before/after comparison)
   */
  compareEntries(entry1: HistoryEntry, entry2: HistoryEntry): {
    riskChange: number;
    riskDirection: 'increased' | 'decreased' | 'stable';
    timeDiff: number; // days
  } {
    const risk1 = this.getRiskPercentage(entry1.results);
    const risk2 = this.getRiskPercentage(entry2.results);
    const riskChange = risk2 - risk1;
    
    let riskDirection: 'increased' | 'decreased' | 'stable';
    if (Math.abs(riskChange) < 2) {
      riskDirection = 'stable';
    } else if (riskChange > 0) {
      riskDirection = 'increased';
    } else {
      riskDirection = 'decreased';
    }
    
    const date1 = new Date(entry1.date);
    const date2 = new Date(entry2.date);
    const timeDiff = Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
    
    return { riskChange, riskDirection, timeDiff };
  }
  
  /**
   * Get risk percentage from results
   */
  private getRiskPercentage(results: any): number {
    if (results?.malignant_risk_percentage !== undefined) {
      return results.malignant_risk_percentage;
    }
    if (results?.confidence !== undefined) {
      return results.confidence * 100;
    }
    return 0;
  }
  
  /**
   * Get storage usage estimate
   */
  getStorageUsage(): { entries: number; estimatedSize: string } {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored) as HistoryEntry[];
        const sizeInBytes = new Blob([stored]).size;
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
        return { entries: history.length, estimatedSize: `${sizeInMB} MB` };
      }
    } catch (error) {
      console.error('Error calculating storage usage:', error);
    }
    return { entries: 0, estimatedSize: '0 MB' };
  }
}

