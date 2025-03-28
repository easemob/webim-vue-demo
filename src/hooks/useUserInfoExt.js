import { computed } from 'vue';
import store from '@/store';

export function useUserInfoExt(msgOptions) {
  const ease_chat_uikit_user_info = computed(() => ({
    nickname: store.getters.loginUserInfo.nickname,
    avatarURL: store.getters.loginUserInfo.avatarurl,
  }));

  const setUserInfoExt = (options) => {
    // 确保ext字段存在
    if (!options.ext) {
      options.ext = {};
    }
    const userInfo = ease_chat_uikit_user_info.value;
    if (!userInfo.nickname && !userInfo.avatarURL) return options;
    options.ext.ease_chat_uikit_user_info = ease_chat_uikit_user_info.value;
    return options;
  };

  return {
    setUserInfoExt,
  };
}
