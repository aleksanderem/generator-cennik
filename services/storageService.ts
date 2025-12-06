import { ThemeConfig, AuditResult } from "../types";

const STORAGE_PREFIX = 'bp_config_';
const AUDIT_STORAGE_PREFIX = 'bp_audit_reports_';

/**
 * Simulates a backend storage service.
 * In a real app, this would fetch/post to an API endpoint /api/configs/{email}
 */
export const storageService = {
  
  async saveConfig(email: string, config: ThemeConfig): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    try {
      const key = `${STORAGE_PREFIX}${email.toLowerCase().trim()}`;
      localStorage.setItem(key, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error("Save failed", e);
      return false;
    }
  },

  async loadConfig(email: string): Promise<ThemeConfig | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const key = `${STORAGE_PREFIX}${email.toLowerCase().trim()}`;
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data) as ThemeConfig;
    } catch (e) {
      console.error("Load failed", e);
      return null;
    }
  },

  // --- Audit Report Storage ---

  async saveAuditReport(report: AuditResult): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 400));
    try {
      // Use ID if exists, or generate timestamp based
      const reportId = report.id || Date.now().toString();
      const reportWithMeta = { ...report, id: reportId, date: new Date().toISOString() };
      
      // Get existing list
      const listKey = `${AUDIT_STORAGE_PREFIX}list`;
      const existingListJson = localStorage.getItem(listKey);
      const existingList = existingListJson ? JSON.parse(existingListJson) : [];
      
      // Add to list (summary only to save space if needed, but here we store full for simplicity in localstorage)
      const newList = [reportWithMeta, ...existingList].slice(0, 10); // Keep last 10
      localStorage.setItem(listKey, JSON.stringify(newList));
      
      return true;
    } catch (e) {
      console.error("Save audit failed", e);
      return false;
    }
  },

  async getSavedReports(): Promise<AuditResult[]> {
    try {
      const listKey = `${AUDIT_STORAGE_PREFIX}list`;
      const json = localStorage.getItem(listKey);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      return [];
    }
  }
};