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

// Generic async key-value store interface to abstract storage backends
interface KeyValueStore {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  save(): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  length(): Promise<number>;
}

// localStorage-based implementation as a browser fallback
class LocalStorageStore implements KeyValueStore {
  private readonly keyPrefix: string;
  private readonly isBrowser: boolean;

  constructor(keyPrefix: string = "settings:") {
    this.keyPrefix = keyPrefix;
    this.isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  private toFullKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.isBrowser) return null;
    try {
      const raw = window.localStorage.getItem(this.toFullKey(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (_err) {
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    if (!this.isBrowser) return;
    try {
      window.localStorage.setItem(this.toFullKey(key), JSON.stringify(value));
    } catch (_err) {
      // ignore quota or serialization errors
    }
  }

  async save(): Promise<void> {
    // No-op for localStorage
    return;
  }

  async has(key: string): Promise<boolean> {
    if (!this.isBrowser) return false;
    return window.localStorage.getItem(this.toFullKey(key)) !== null;
  }

  async delete(key: string): Promise<void> {
    if (!this.isBrowser) return;
    try {
      window.localStorage.removeItem(this.toFullKey(key));
    } catch (_err) {
      // ignore
    }
  }

  async clear(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(this.keyPrefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => window.localStorage.removeItem(k));
    } catch (_err) {
      // ignore
    }
  }

  async length(): Promise<number> {
    if (!this.isBrowser) return 0;
    try {
      let count = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(this.keyPrefix)) count++;
      }
      return count;
    } catch (_err) {
      return 0;
    }
  }
}

/**
 * Application settings store
 */
class SettingsStore {
  private store: KeyValueStore;

  constructor() {
    this.store = this.createInitialStore();
    this.initialize();
  }

  private createInitialStore(): KeyValueStore {
    try {
      if (typeof window !== "undefined" && (window as any).__TAURI__) {
        return new LazyStore("settings.json") as unknown as KeyValueStore;
      }
    } catch (_err) {
      // ignore and fallback to localStorage
    }
    return new LocalStorageStore("settings:");
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

      if (import.meta.env.DEV && typeof window !== "undefined") {
        (window as any).settingsStore = this;
      }
    } catch (error) {
      console.error("Failed to initialize settings store:", error);
      // Fallback to localStorage store if tauri store fails at runtime
      if (!(this.store instanceof LocalStorageStore)) {
        this.store = new LocalStorageStore("settings:");
        try {
          const isEmpty = !(await this.store.length());
          if (isEmpty) {
            await this.setDefaults();
          }
        } catch (fallbackError) {
          console.error("Failed to initialize fallback localStorage store:", fallbackError);
        }
      }
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
