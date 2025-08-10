import { LazyStore } from "@tauri-apps/plugin-store";

export interface SettingsValues {
  sidebarTools: string[];
  // theme: 'light' | 'dark' | 'auto';
}

export type SettingsKey = keyof SettingsValues;

// Define default values for all settings
export const DEFAULT_SETTINGS_VALUES: SettingsValues = {
  sidebarTools: [],
};

// IMPORTANT might skip keys if not defined in DEFAULT_SETTINGS_VALUES like for optional settings
export const AVAILABLE_SETTINGS_KEYS: SettingsKey[] = Object.keys(
  DEFAULT_SETTINGS_VALUES
) as SettingsKey[];

/**
 * Application settings store
 */
class SettingsStore {
  private store: LazyStore;

  constructor() {
    this.store = new LazyStore("settings.json");
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const isEmpty = !(await this.store.length());

      if (isEmpty) {
        await this.setDefaults();
        if (import.meta.env.DEV) {
          console.log("Settings store initialized with default values");
        }
      }

      if (import.meta.env.DEV) {
        (window as any).settingsStore = this;
      }
    } catch (error) {
      console.error("Failed to initialize settings store:", error);
    }
  }

  private async setDefaults(): Promise<void> {
    await Promise.all(
      Object.entries(DEFAULT_SETTINGS_VALUES).map(([key, value]) => this.store.set(key, value))
    );

    await this.store.save();
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.store.get<T>(key);
      return value ?? null;
    } catch (error) {
      console.error(`Failed to get key "${key}" from settings store:`, error);
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T): Promise<boolean> {
    try {
      await this.store.set(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to set key "${key}" in settings store:`, error);
      return false;
    }
  }

  async save(): Promise<boolean> {
    try {
      await this.store.save();
      return true;
    } catch (error) {
      console.error("Failed to save settings store:", error);
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return await this.store.has(key);
    } catch (error) {
      console.error(`Failed to check key "${key}" in settings store:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.store.delete(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete key "${key}" from settings store:`, error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.store.clear();
      return true;
    } catch (error) {
      console.error("Failed to clear settings store:", error);
      return false;
    }
  }

  async length(): Promise<number> {
    try {
      return await this.store.length();
    } catch (error) {
      console.error("Failed to get settings store length:", error);
      return 0;
    }
  }

  async getTyped<K extends SettingsKey>(key: K): Promise<SettingsValues[K] | null> {
    return this.get<SettingsValues[K]>(key);
  }

  async setTyped<K extends SettingsKey>(key: K, value: SettingsValues[K]): Promise<boolean> {
    return this.set(key, value);
  }

  async update<T = unknown>(key: string, value: T): Promise<boolean> {
    const success = await this.set(key, value);
    if (success) {
      await this.save();
    }
    return success;
  }

  async updateTyped<K extends SettingsKey>(key: K, value: SettingsValues[K]): Promise<boolean> {
    return this.update(key, value);
  }

  async getAllSettings(): Promise<Partial<SettingsValues>> {
    const settings: Partial<SettingsValues> = {};

    for (const key of AVAILABLE_SETTINGS_KEYS) {
      try {
        const value = await this.getTyped(key);
        if (value !== null) {
          (settings as any)[key] = value;
        }
      } catch (error) {
        console.error(`Failed to get setting "${key}":`, error);
      }
    }

    return settings;
  }

  async resetToDefaults(): Promise<boolean> {
    try {
      await this.clear();
      await this.setDefaults();
      return true;
    } catch (error) {
      console.error("Failed to reset settings to defaults:", error);
      return false;
    }
  }
}

export const settingsStore = new SettingsStore();
