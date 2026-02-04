import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Running in demo mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Auth helpers
export const auth = {
  // 카카오 로그인
  signInWithKakao: async () => {
    if (!supabase) return { error: { message: 'Demo mode' } };
    return supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  // 구글 로그인
  signInWithGoogle: async () => {
    if (!supabase) return { error: { message: 'Demo mode' } };
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  // 로그아웃
  signOut: async () => {
    if (!supabase) return { error: null };
    return supabase.auth.signOut();
  },

  // 현재 유저 가져오기
  getUser: async () => {
    if (!supabase) return { data: { user: null }, error: null };
    return supabase.auth.getUser();
  },

  // 세션 변경 감지
  onAuthStateChange: (callback) => {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helpers
export const db = {
  // 사용자 프로필 가져오기/생성
  getOrCreateProfile: async (userId) => {
    if (!supabase) return { data: null, error: null };

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // 프로필이 없으면 생성
      return supabase.from('profiles').insert({ id: userId }).select().single();
    }

    return { data, error };
  },

  // 프로필 업데이트
  updateProfile: async (userId, updates) => {
    if (!supabase) return { data: null, error: null };
    return supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
  },

  // 사람 목록 가져오기
  getPeople: async (userId) => {
    if (!supabase) return { data: [], error: null };
    return supabase
      .from('people')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  // 사람 추가
  addPerson: async (userId, personData) => {
    if (!supabase) return { data: null, error: null };
    return supabase
      .from('people')
      .insert({ ...personData, user_id: userId })
      .select()
      .single();
  },

  // 사람 수정
  updatePerson: async (personId, updates) => {
    if (!supabase) return { data: null, error: null };
    return supabase
      .from('people')
      .update(updates)
      .eq('id', personId)
      .select()
      .single();
  },

  // 사람 삭제
  deletePerson: async (personId) => {
    if (!supabase) return { error: null };
    return supabase.from('people').delete().eq('id', personId);
  },

  // 대화 기록 저장
  saveMessage: async (userId, personId, message) => {
    if (!supabase) return { data: null, error: null };
    return supabase
      .from('messages')
      .insert({
        user_id: userId,
        person_id: personId,
        role: message.role,
        content: message.content,
      })
      .select()
      .single();
  },

  // 대화 기록 가져오기
  getMessages: async (userId, personId, limit = 50) => {
    if (!supabase) return { data: [], error: null };
    return supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .eq('person_id', personId)
      .order('created_at', { ascending: true })
      .limit(limit);
  },
};

// Storage helpers
export const storage = {
  // 사진 업로드
  uploadPhoto: async (userId, file, path) => {
    if (!supabase) return { data: null, error: null };

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${path}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, file);

    if (error) return { data: null, error };

    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    return { data: { path: fileName, url: urlData.publicUrl }, error: null };
  },

  // 사진 삭제
  deletePhoto: async (path) => {
    if (!supabase) return { error: null };
    return supabase.storage.from('photos').remove([path]);
  },
};

export default supabase;
