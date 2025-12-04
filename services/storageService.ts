import { ThemeConfig } from "../types";

const STORAGE_PREFIX = 'bp_config_';

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
  }
};