import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryService, HistoryEntry } from '../../../services/history.service';

@Component({
  selector: 'app-lesion-history',
  standalone: true,
  imports: [CommonModule],
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
  
  constructor(private historyService: HistoryService) {}
  
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

