import axios from 'axios';
import { SynthesisResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiService = {
  async query(prompt: string, providers?: string[]): Promise<SynthesisResult> {
    const response = await axios.post(`${API_BASE_URL}/api/ai/query`, {
      prompt,
      providers,
    });
    return response.data;
  },

  async getAvailableProviders(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/api/ai/providers`);
    return response.data.providers;
  },

  async checkHealth(): Promise<{ status: string; availableProviders: string[] }> {
    const response = await axios.get(`${API_BASE_URL}/api/ai/health`);
    return response.data;
  },
};
