<template>
  <div class="personCard" v-if="visible">
    <a-modal
      mask
      v-model="visible"
      :title="!isShowFriendsCard?'个人名片':'好友名片'"
      :footer="null"
      @ok="handleOk"
      @cancel="initInfoState"
    >
      <div class="ownInfo" v-show="!isShowFriendsCard">
        <div class="avatar_box">
          <img
            class="avatar"
            :src="ownInfo.avatarurl ? ownInfo.avatarurl : defaultAvatar"
            alt=""
            @click="isShowList = !isShowList"
          />
          <!-- <a-tooltip placement="bottom">
            <template slot="title">
              <span>{{statusExt || statusObj.title}}</span>
            </template>
            <img class="status_img" :src="statusObj.img" alt="">
          </a-tooltip> -->
          <transition name="draw">
            <div class="avatar_list" v-show="isShowList">
              <a-divider>自选头像</a-divider>
              <div v-for="(item, index) in avatarList" :key="index">
                <img
                  :src="item"
                  alt=""
                  @click="commitUserInfo('avatarurl', item)"
                />
              </div>
            </div>
          </transition>
        </div>
        <!-- 昵称 -->
        <div class="infoSet nickname_box">
          昵称：
          <p v-show="!inputInfo.nickname.state">
            {{ ownInfo.nickname ? ownInfo.nickname : "暂无昵称" }}
          </p>
          <a-icon
            type="edit"
            v-show="!inputInfo.nickname.state"
            @click="inputInfo.nickname.state = !inputInfo.nickname.state"
          />
          <a-input-search
            v-show="inputInfo.nickname.state"
            :style="inputSyle"
            placeholder="请输入新昵称..."
            enter-button="确认"
            size="small"
            v-model="inputInfo.nickname.value"
            @search="commitUserInfo('nickname')"
          />
        </div>
        <!-- 环信ID -->
        <div class="infoSet id_box">用户ID：{{ loginUser }}</div>
        <!-- 个性签名 -->
        <div class="infoSet sign_box">
          个性签名：
          <p v-show="!inputInfo.sign.state">
            {{ ownInfo.sign ? ownInfo.sign : "无个性，不签名..." }}
          </p>
          <a-input-search
            v-show="inputInfo.sign.state"
            v-model="inputInfo.sign.value"
            :style="inputSyle"
            placeholder="个性签名"
            enter-button="确认"
            size="small"
            @search="commitUserInfo('sign')"
          />
          <a-icon
            type="edit"
            v-show="!inputInfo.sign.state"
            @click="inputInfo.sign.state = !inputInfo.sign.state"
          />
        </div>
        <!-- 性别 -->
        <div class="infoSet gender_box">
          性别：
          <p v-show="!inputInfo.gender.state">
            {{
              ownInfo.gender
                ? ownInfo.gender === "1"
                  ? "MR."
                  : "MISS."
                : "未知"
            }}
          </p>
          <a-radio-group
            name="radioGroup"
            v-show="inputInfo.gender.state"
            :default-value="0"
          >
            <a-radio @click="inputInfo.gender.value = '1'" :value="1">
              MR.
            </a-radio>
            <a-radio @click="inputInfo.gender.value = '2'" :value="2">
              MISS.
            </a-radio>
          </a-radio-group>
          <a-icon
            type="edit"
            @click="commitUserInfo('gender', ownInfo.gender)"
          />
        </div>
        <!-- 出生日期 -->
        <div class="infoSet birth_box">
          出生日期：
          <p v-show="!inputInfo.birth.state">
            {{ ownInfo.birth ? ownInfo.birth : "1946-02-14" }}
          </p>
          <a-input-search
            v-show="inputInfo.birth.state"
            v-model="inputInfo.birth.value"
            :style="inputSyle"
            placeholder="格式（2001-12-11）"
            enter-button="确认"
            size="small"
            @search="commitUserInfo('birth')"
          />
          <a-icon
            v-show="!inputInfo.birth.state"
            @click="inputInfo.birth.state = !inputInfo.birth.state"
            type="edit"
          />
        </div>
        <!-- 电话 -->
        <div class="infoSet phone_box">
          电话：
          <p v-show="!inputInfo.phone.state">
            {{ ownInfo.phone ? ownInfo.phone : "电话号码" }}
          </p>
          <a-input-search
            v-model="inputInfo.phone.value"
            v-show="inputInfo.phone.state"
            :style="inputSyle"
            placeholder="请输入电话十位号码"
            enter-button="确认"
            size="small"
            @search="commitUserInfo('phone')"
          />
          <a-icon
            v-show="!inputInfo.phone.state"
            @click="inputInfo.phone.state = !inputInfo.phone.state"
            type="edit"
          />
        </div>
        <!-- 邮箱 -->
        <div class="infoSet email_box">
          邮箱：
          <p v-show="!inputInfo.mail.state">
            {{ ownInfo.mail ? ownInfo.mail : "暂无邮箱地址" }}
          </p>
          <a-input-search
            v-model="inputInfo.mail.value"
            v-show="inputInfo.mail.state"
            :style="inputSyle"
            placeholder="111@qq.com"
            enter-button="确认"
            size="small"
            @search="commitUserInfo('mail')"
          />
          <a-icon
            v-show="!inputInfo.mail.state"
            @click="inputInfo.mail.state = !inputInfo.mail.state"
            type="edit"
          />
        </div>
      </div>
      <div class="friendInfo" v-show="isShowFriendsCard">
        <div class="friendInfo_box" v-if="userInfo">
          <div class="avatar_box">
            <img
              :src="userInfo.friendDetail.avatarurl || defaultAvatar"
              alt=""
            />
            <!-- <a-tooltip placement="bottom">
              <template slot="title">
                <span>{{userInfo.presence.ext}}</span>
              </template>
              <img class="status_img" :src="getUserOnlineStatus(userInfo.presence)" alt="">
            </a-tooltip> -->
          </div>
          <div class="nickname">
            昵称：<p>{{userInfo.friendDetail.nickname || '暂无昵称'}}</p>
          </div>
          <div class="nickname">
            状态：<p>{{userInfo.friendDetail.presence || '暂无状态'}}</p>
          </div>
          <div class="id">
            用户ID：<p>{{userInfo.name}}</p>
          </div>
          <div class="sign">
            个性签名：<p>{{userInfo.friendDetail.sign || '无个性，不签名...'}}</p>
          </div>
          <div class="gender">
            性别：<p>{{userInfo.friendDetail.gender?(userInfo.friendDetail.gender===1?'男':'女'):'未知'}}</p>
          </div>
          <div class="birth">
            出生日期：<p>{{userInfo.friendDetail.birth || '未知'}}</p>
          </div>
          <div class="phone">
            电话：<p>{{userInfo.friendDetail.phone || '暂无号码'}}</p>
          </div>
          <div class="email">
            E-mail：<p>{{userInfo.friendDetail.mail || '暂无邮箱地址'}}</p>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import './personCard.less';
import { mapActions, mapState } from 'vuex';
export default{
	data(){
		return {
			loginUser: JSON.parse(localStorage.getItem('userInfo')).userId || '',
			visible: false,
			userInfo: null,
			baseAvatarUrl:
        'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/IMDemo/avatar/',
			defaultAvatar: require('../../assets/headPortrait.jpeg'),
			inputSyle: 'width:300px',
			isShowList: false,
			inputInfo: {
				nickname: { state: false, value: '' },
				sign: { state: false, value: '' },
				gender: { state: false, value: '' },
				birth: { state: false, value: '' },
				phone: { state: false, value: '' },
				mail: { state: false, value: '' }
			},
			ruler: {
				// eslint-disable-next-line no-useless-escape
				birth: /^((19[2-9]\d{1})|(20((0[0-9])|(1[0-8]))))\-((0?[1-9])|(1[0-2]))\-((0?[1-9])|([1-2][0-9])|30|31)$/,
				mail: /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/,
				phone: /^[1][0-9]{10}$/
			},
			isShowFriendsCard: false,
			statusObj: {},
			statusExt: ''
		};
	},
	computed: {
		...mapState({
			ownInfo: state => state.login.userDetail
		}),
		avatarList: function(){
			let count = 9;
			let list = [];
			for(let i = 0; i < count; i++){
				list.push(`${this.baseAvatarUrl}Image${i + 1}.png`);
			}
			return list;
		}
	},
	methods: {
		...mapActions(['updateOwnUserInfo']),
		// 获取好友的用户属性信息
		// eslint-disable-next-line require-await
		async getOthersUserInfo(detail){
			const { friendDetail, name, presence } = detail;
			this.userInfo = { friendDetail, name, presence };
			this.isShowFriendsCard = true;
			this.visible = true;
		},
		// 提交要设置的用户属性
		async commitUserInfo(type, value){
			// 头像属性处理
			if(type === 'avatarurl'){
				await this.updateOwnUserInfo({
					infoValue: value,
					type
				});
			}
			// 性别属性处理
			if(type === 'gender'){
				// 性别属性处理
				this.inputInfo.gender.state = !this.inputInfo.gender.state;
				let val = this.inputInfo.gender.value;
				if(val === '' || val == value){
					return false;
				}
				await this.updateOwnUserInfo({
					infoValue: this.inputInfo.gender.value,
					type
				});
				this.inputInfo.gender.value = '';
        
			}
			// 其他属性处理
			if(type !== 'avatarurl' && type !== 'gender'){
				if(this.inputInfo[type].value){
					let val = this.inputInfo[type].value;
					switch(type){
					case 'birth':{
						if(!this.ruler.birth.test(val)) return this.$message.warning(
							'出生日期格式不合法，请重新输入...'
						);
						break;
					}
					case 'phone':{
						if(!this.ruler.phone.test(val)) return this.$message.warning('号码格式不合法，请重新输入...');
						break;
					}
					case 'mail':{
						if(!this.ruler.mail.test(val)) return this.$message.warning('邮箱地址不合法，请重新输入...');
						break;
					}
					default:
						break;
					}
					await this.updateOwnUserInfo({
						infoValue: val,
						type
					});
					// eslint-disable-next-line no-sequences
					(this.inputInfo[type].state = false), (val = '');
				}
				else{
					this.inputInfo[type].state = false;
				}
			}
		},

		// 关闭个性页初始化弹窗
		initInfoState(){
			this.inputInfo.nickname.state = false;
			this.inputInfo.sign.state = false;
			this.inputInfo.gender.state = false;
			this.inputInfo.birth.state = false;
			this.inputInfo.phone.state = false;
			this.inputInfo.mail.state = false;
			setTimeout(() => {
				this.isShowFriendsCard = false;
			}, 300);
		},
		showModal(val, ext){
			this.visible = true;
			this.statusExt = ext
			if(val){
				this.statusObj = val
			}
		},
		handleOk(e){
			this.visible = false;
		},
		getUserOnlineStatus(val){
			const { ext } = val
			switch(ext){
			case 'Offline':
				return require('../../assets/Offline.png')
			case 'Online':
				return require('../../assets/Online.png')
			case 'Busy':
				return require('../../assets/Busy.png')
			case 'Do not Disturb':
				return require('../../assets/Do_not_Disturb.png')
			case 'Leave':
				return require('../../assets/leave.png')
			default:
				return require('../../assets/custom.png')
			}
		}
	}
};
</script>
