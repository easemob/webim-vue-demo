import { computed } from 'vue';
import store from '@/store';

export function useUserInfoExt(msgOptions) {
  // 发送时使用跨端统一格式：avatarURL (大写，与其他端保持一致)
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
    // 检查是否有有效的用户信息
    if (!userInfo.nickname && !userInfo.avatarURL) return options;
    // 发送时使用统一格式
    options.ext.ease_chat_uikit_user_info = ease_chat_uikit_user_info.value;
    return options;
  };

  return {
    setUserInfoExt,
  };
}
