import { computed, reactive, watch, toRefs } from 'vue';
import _ from 'lodash';
import { pinyin } from 'pinyin-pro';
import store from '@/store';

const useSortedContactsWithPinyin = () => {
  const state = reactive({
    sortedFriendListWithRemark: {},
  });

  const getContactsWithRemarkMap = computed(() => {
    return store.getters.getContactsWithRemarkMap;
  });

  const getContactsUserInfosMap = computed(() => {
    return store.getters.getContactsUserInfosMap;
  });

  const _getUserNickName = (hxId) => {
    if (
      getContactsWithRemarkMap.value.has(hxId) &&
      getContactsWithRemarkMap.value.get(hxId).remark
    ) {
      return getContactsWithRemarkMap.value.get(hxId).remark;
    } else if (
      getContactsUserInfosMap.value.has(hxId) &&
      getContactsUserInfosMap.value.get(hxId).nickname
    ) {
      return getContactsUserInfosMap.value.get(hxId).nickname;
    } else {
      return hxId;
    }
  };

  watch(
    getContactsWithRemarkMap,
    (newMap) => {
      if (newMap.size > 0) {
        const resultObj = {};
        const containerObj = {};
        for (const [key, value] of newMap) {
          const pinyinKey = pinyin(_getUserNickName(key), {
            pattern: 'initial',
          })[0];
          if (!containerObj[pinyinKey]) {
            containerObj[pinyinKey] = [];
          }
          containerObj[pinyinKey].push(value);
        }
        const keys = _.sortBy(_.keys(containerObj));
        keys.forEach((k) => {
          resultObj[k] = containerObj[k];
        });
        state.sortedFriendListWithRemark = { ...resultObj };
      }
    },
    {
      immediate: true,
      deep: true,
    },
  );
  return { ...toRefs(state) };
};

export default useSortedContactsWithPinyin;
