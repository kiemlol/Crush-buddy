import { supabase } from '../lib/supabase';

export interface JournalEntry {
  id?: string;
  created_at?: string;
  user_id: string;
  content: string;
  mood?: string;
  analysis?: any;
}

export const supabaseService = {
  // Journal
  async saveJournal(entry: Omit<JournalEntry, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('journals')
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getJournals(userId: string) {
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async deleteJournal(id: string) {
    const { error } = await supabase
      .from('journals')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Custom Auth System (Username only, bypassing Supabase Auth limits)
  async signUp(username: string, password: string) {
    // 1. Check if username exists
    const { data: existingUser } = await supabase
      .from('user_accounts')
      .select('username')
      .eq('username', username.trim())
      .single();

    if (existingUser) {
      throw new Error('Tên đăng nhập này đã tồn tại!');
    }

    // 2. Insert new user
    const { data, error } = await supabase
      .from('user_accounts')
      .insert([{ 
        username: username.trim(), 
        password: password.trim() // Note: In a real app, hash this!
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Save session to localStorage
    localStorage.setItem('crush_buddy_user', JSON.stringify(data));
    return { user: data };
  },

  async signIn(username: string, password: string) {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password.trim())
      .single();

    if (error || !data) {
      throw new Error('Sai tên đăng nhập hoặc mật khẩu!');
    }

    // Save session to localStorage
    localStorage.setItem('crush_buddy_user', JSON.stringify(data));
    return { user: data };
  },

  async getCurrentUser() {
    const saved = localStorage.getItem('crush_buddy_user');
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  },

  async signOut() {
    localStorage.removeItem('crush_buddy_user');
  }
};
