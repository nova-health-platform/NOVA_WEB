import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService, HistoryEntry } from '../../../services/history.service';

@Component({
  selector: 'app-lesion-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lesion-history.component.html',
  styleUrl: './lesion-history.component.scss'
})
export class LesionHistoryComponent {
  @Input() history: HistoryEntry[] = [];
  @Input() selectedIds: string[] = []; // For comparison mode
  @Output() viewEntry = new EventEmitter<HistoryEntry>();
  @Output() deleteEntry = new EventEmitter<string>();
  @Output() compareEntries = new EventEmitter<string[]>();
  
  expandedId: string | null = null;
  comparisonMode: boolean = false;
  profileFilter: string = 'all';
  dateFrom: string | null = null;
  dateTo: string | null = null;
  
  constructor(private historyService: HistoryService) {}

  /**
   * Unique profile names from history
   */
  get profileOptions(): string[] {
    const names = new Set<string>();
    this.history.forEach(h => {
      const name = h.profile?.name || h.patientData?.profileName;
      if (name) {
        names.add(name);
      }
    });
    return Array.from(names);
  }

  /**
   * Filtered history by profile and date range
   */
  get filteredHistory(): HistoryEntry[] {
    return this.history.filter(item => {
      // Profile filter
      if (this.profileFilter === 'no-profile') {
        if (item.profile?.name || item.patientData?.profileName) return false;
      } else if (this.profileFilter !== 'all') {
        const name = item.profile?.name || item.patientData?.profileName;
        if (name !== this.profileFilter) return false;
      }

      // Date filter
      const ts = new Date(item.date).getTime();
      if (this.dateFrom) {
        const fromTs = new Date(this.dateFrom).getTime();
        if (ts < fromTs) return false;
      }
      if (this.dateTo) {
        const toTs = new Date(this.dateTo).getTime() + 24 * 60 * 60 * 1000 - 1; // end of day
        if (ts > toTs) return false;
      }

      return true;
    });
  }
  
  /**
   * Toggle expansion of history item
   */
  toggleExpansion(id: string): void {
    if (this.expandedId === id) {
      this.expandedId = null;
    } else {
      this.expandedId = id;
    }
  }
  
  /**
   * Get risk percentage
   */
  getRiskPercentage(results: any): number {
    if (results?.malignant_risk_percentage !== undefined) {
      return results.malignant_risk_percentage;
    }
    if (results?.confidence !== undefined) {
      return results.confidence * 100;
    }
    return 0;
  }
  
  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Get risk category color
   */
  getRiskColorClass(riskPercentage: number): string {
    if (riskPercentage < 20) return 'bg-green-500/20 text-green-400';
    if (riskPercentage < 50) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  }
  
  /**
   * Toggle comparison mode
   */
  toggleComparisonMode(): void {
    this.comparisonMode = !this.comparisonMode;
    if (!this.comparisonMode) {
      this.selectedIds = [];
    }
  }
  
  /**
   * Toggle selection for comparison
   */
  toggleSelection(id: string): void {
    if (!this.comparisonMode) return;
    
    const index = this.selectedIds.indexOf(id);
    if (index === -1) {
      if (this.selectedIds.length < 2) {
        this.selectedIds = [...this.selectedIds, id];
      }
    } else {
      this.selectedIds = this.selectedIds.filter(sid => sid !== id);
    }
  }
  
  /**
   * Compare selected entries
   */
  compareSelected(): void {
    if (this.selectedIds.length === 2) {
      this.compareEntries.emit(this.selectedIds);
    }
  }
  
  /**
   * Get comparison info between two entries
   */
  getComparisonInfo(id1: string, id2: string): {
    riskChange: number;
    riskDirection: 'increased' | 'decreased' | 'stable';
    timeDiff: number;
  } | null {
    const entry1 = this.history.find(h => h.id === id1);
    const entry2 = this.history.find(h => h.id === id2);
    
    if (!entry1 || !entry2) return null;
    
    return this.historyService.compareEntries(entry1, entry2);
  }
}

