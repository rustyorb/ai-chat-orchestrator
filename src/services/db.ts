import Dexie, { Table } from 'dexie';
import { Persona, Conversation, ModelConfig, AppSettings } from '../types';

class AppDatabase extends Dexie {
  personas!: Table<Persona, string>;
  conversations!: Table<Conversation, string>;
  models!: Table<ModelConfig, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('AIOrchestrator');
    
    this.version(2).stores({
      personas: 'id, name, modelId, created, updated',
      conversations: 'id, title, created, updated, isActive',
      models: 'id, name, provider, apiKey, baseUrl',
      settings: '',
    });
    
    // Migration for existing data
    this.version(1).stores({
      personas: 'id, name, modelId, created, updated',
      conversations: 'id, title, created, updated, isActive',
      models: 'id, name, provider',
      settings: '',
    });
  }

  async getPersonas(): Promise<Persona[]> {
    return this.personas.toArray();
  }

  async getConversations(): Promise<Conversation[]> {
    return this.conversations.toArray();
  }

  async getModels(): Promise<ModelConfig[]> {
    return this.models.toArray();
  }

  async getSettings(): Promise<AppSettings | undefined> {
    return this.settings.get('app_settings');
  }

  async savePersona(persona: Persona): Promise<string> {
    return this.personas.put(persona);
  }

  async saveConversation(conversation: Conversation): Promise<string> {
    return this.conversations.put(conversation);
  }

  async saveModel(model: ModelConfig): Promise<string> {
    return this.models.put(model);
  }

  async saveSettings(settings: AppSettings): Promise<string> {
    // Use a fixed key for settings since we only have one settings object
    return this.settings.put(settings, 'app_settings');
  }

  async deletePersona(id: string): Promise<void> {
    await this.personas.delete(id);
  }

  async deleteConversation(id: string): Promise<void> {
    await this.conversations.delete(id);
  }

  async deleteModel(id: string): Promise<void> {
    await this.models.delete(id);
  }

  async exportData(): Promise<{
    personas: Persona[];
    conversations: Conversation[];
    models: ModelConfig[];
    settings: AppSettings | undefined;
  }> {
    return {
      personas: await this.getPersonas(),
      conversations: await this.getConversations(),
      models: await this.getModels(),
      settings: await this.getSettings(),
    };
  }

  async importData(data: {
    personas?: Persona[];
    conversations?: Conversation[];
    models?: ModelConfig[];
    settings?: AppSettings;
  }): Promise<void> {
    await Dexie.waitFor((async () => {
      if (data.personas?.length) {
        await this.personas.bulkPut(data.personas);
      }
      if (data.conversations?.length) {
        await this.conversations.bulkPut(data.conversations);
      }
      if (data.models?.length) {
        await this.models.bulkPut(data.models);
      }
      if (data.settings) {
        await this.settings.put(data.settings, 'app_settings');
      }
    })());
  }
}

export const db = new AppDatabase();