import { EMClient } from '../index';
import { INFORM_FROM } from '@/constant';
import store from '@/store';
import { GROUP_OPERATION_TYPE } from '../constant';
export const imGroupListener = () => {
  const submitInformData = (fromType, informContent) => {
    store.dispatch('createNewInform', { fromType, informContent });
  };
  const onDispatchGroupEvent = (groupevent) => {
    const { operation, id: groupId, from } = groupevent;
    switch (operation) {
      //入群通知
      case GROUP_OPERATION_TYPE.MEMBER_PRESENCE:
        {
          const params = {
            groupId,
            type: 'groupMemberCount',
            params: groupevent.memberCount,
          };
          store.commit('UPDATE_CACHE_GROUP_INFO', params);
          store.commit('UPDATE_GROUP_MEMBERS', {
            groupId,
            type: GROUP_OPERATION_TYPE.MEMBER_PRESENCE,
            member: from,
          });
        }
        break;
      //群成员退群通知
      case GROUP_OPERATION_TYPE.MEMBER_ABSENCE:
        {
          //退群通知
          const params = {
            groupId,
            type: 'groupMemberCount',
            params: groupevent.memberCount,
          };
          store.commit('UPDATE_CACHE_GROUP_INFO', params);
          store.commit('UPDATE_GROUP_MEMBERS', {
            groupId,
            type: GROUP_OPERATION_TYPE.MEMBER_ABSENCE,
            member: from,
          });
        }
        break;
      //群组公告更新
      case GROUP_OPERATION_TYPE.UPDATE_ANNOUNCEMENT:
        {
          console.log('>>>>群组公告更新', groupevent);
          store.dispatch('fetchAnnounmentFromServer', groupId);
        }
        break;
      //群组管理员设置
      case GROUP_OPERATION_TYPE.SET_ADMIN:
        {
          store.commit('UPDATE_GORUPS_ADMIN', {
            type: GROUP_OPERATION_TYPE.SET_ADMIN,
            groupId,
            userId: from,
          });
        }
        break;
      //群组管理员取消
      case GROUP_OPERATION_TYPE.REMOVE_ADMIN:
        {
          store.commit('UPDATE_GORUPS_ADMIN', {
            type: GROUP_OPERATION_TYPE.REMOVE_ADMIN,
            groupId,
            userId: from,
          });
        }
        break;
      //群组成员禁言
      case GROUP_OPERATION_TYPE.MUTE_MEMBER:
        {
          store.dispatch('fetchGroupsMuteListFromServer', groupId);
        }
        break;
      //群组成员解除禁言
      case GROUP_OPERATION_TYPE.UNMUTE_MEMBER:
        {
          store.dispatch('fetchGroupsMuteListFromServer', groupId);
        }
        break;
      //被移出群组
      case GROUP_OPERATION_TYPE.REMOVE_MEMBER:
        {
          //从群组列表中删除某群
          store.commit('DELETE_JOINED_GROUP_LIST', {
            groupId: groupId,
          });
        }
        break;
      //群组解散
      case GROUP_OPERATION_TYPE.DESTROY:
        {
          console.log('>>>>解散删除群组');
          //从群组列表中删除某群
          store.commit('DELETE_JOINED_GROUP_LIST', {
            groupId: groupId,
          });
        }
        break;
      //群组内更新了群组信息
      case GROUP_OPERATION_TYPE.UPDATE_INFO:
        {
          const { detail } = groupevent;
          if (detail.name) {
            store.commit('UPDATE_CACHE_GROUP_INFO', {
              groupId,
              type: 'groupName',
              params: detail.name,
            });
          } else if (detail.description) {
            store.commit('UPDATE_CACHE_GROUP_INFO', {
              groupId,
              type: 'groupDescription',
              params: detail.description,
            });
          }
        }
        break;
      //接受入群邀请
      case GROUP_OPERATION_TYPE.ACCEPT_REQUEST:
        {
          //更新群组列表
          store.dispatch('fetchJoinedGroupListFromServer', {
            startPageNum: 0,
          });
        }
        break;
      //群成员更新了群组内成员属性
      case GROUP_OPERATION_TYPE.MEMBER_ATTRIBUTES_UPDATE:
        {
          console.log('groupevent', groupevent);
          store.commit('UsersProfile/UPDATE_USER_PROFILE', {
            userId: from,
            sourceType: 'group',
            groupId: groupId,
            profile: { nickName: groupevent?.attributes?.nickName },
          });
        }
        break;
      //管理员直接邀请进群
      case GROUP_OPERATION_TYPE.DIRECT_JOINED: {
        //更新群组列表
        store.dispatch('fetchJoinedGroupListFromServer', {
          startPageNum: 0,
        });
      }
      default:
        break;
    }
  };
  const mountGroupEventListener = () => {
    EMClient.addEventHandler('groupEvent', {
      onGroupEvent: (groupevent) => {
        console.log('groupEvent: ', groupevent);
        submitInformData(INFORM_FROM.GROUP, groupevent);
        onDispatchGroupEvent(groupevent);
      },
    });
  };
  return {
    mountGroupEventListener,
  };
};
