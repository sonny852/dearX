import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Running in demo mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'implicit',
        persistSession: true,
        storageKey: 'dearx-auth-token',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })
  : null;

// Auth helpers
export const auth = {
  // 카카오 로그인
  signInWithKakao: () => {
    if (!supabase) return { error: { message: 'Demo mode' } };
    return supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}`,
        scopes: 'profile_nickname profile_image',
      },
    });
  },

  // 구글 로그인
  signInWithGoogle: () => {
    if (!supabase) return { error: { message: 'Demo mode' } };
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
  },

  // OAuth URL 미리 생성 (모바일 Safari: async 리디렉트 차단 대응)
  // skipBrowserRedirect로 JS 리디렉트만 막고, URL에서 skip_http_redirect 제거해야 서버가 정상 리디렉트함
  getAuthUrl: async (provider, scopes) => {
    if (!supabase) return null;
    const options = {
      redirectTo: `${window.location.origin}`,
      skipBrowserRedirect: true,
    };
    if (scopes) options.scopes = scopes;
    const { data } = await supabase.auth.signInWithOAuth({ provider, options });
    if (!data?.url) return null;
    // skip_http_redirect 제거 — 이 파라미터가 있으면 Supabase가 리디렉트 대신 JSON 반환
    const url = new URL(data.url);
    url.searchParams.delete('skip_http_redirect');
    return url.toString();
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

  // 세션 가져오기 (localStorage에서 바로 복원, 네트워크 요청 없음)
  getSession: async () => {
    if (!supabase) return { data: { session: null }, error: null };
    return supabase.auth.getSession();
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

    const { error } = await supabase.storage
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
