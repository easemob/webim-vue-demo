<template>
  <div>
    <a-icon
      type="history"
      :style="{
        fontSize: '20px',
        color: 'rgba(0, 0, 0, 0.65)',
        marginLeft: '8px',
        cursor: 'pointer'
      }"
      @click="handleHistory"
    />
    <a-modal
      title="历史记录"
      v-model="showModal"
      @cancel="handlerClose"
      :footer="null"
      width="720px"
      height="480px"
    >
      <div>
        <a-input-search
          v-model="searchValue"
          placeholder="input search text"
          enter-button
          @search="onSearch"
          @change="onChangeInput"
        />
      </div>
      <div :style="{ height: '480px', overflowY: 'scroll', marginTop:'8px' }">
        <div v-for="(item, i) in msgObj" :key="i + item.mid">
          <li>
            <div class="info-style">
              <h2 class="name-style">{{ item.from }}</h2>
              <div class="time-style" :style="{ 'text-align': 'left' }">
                {{ renderTime(item.time) }}
              </div>
            </div>
            <div :style="{height: item.type === 'file' ? '105px': '100%' }">
              <img
                :key="item.msg"
                :src="item.msg ? item.msg : ''"
                v-if="item.type === 'img'"
                class="img-style"
              />
              <!-- 文件card -->
              <div
                v-else-if="item.type === 'file'"
                class="file-style"
                :style="{ float: 'left' }"
              >
                <a-card :body-style="{ padding: '0px' }">
                  <div style="padding: 14px">
                    <h2>文件</h2>
                    <span>
                      <h3>{{ item.filename }}</h3>
                    </span>
                    <div class="bottom clearfix">
                      <span>{{ readablizeBytes(item.file_length) }}</span>
                      <a :href="item.msg" :download="item.filename">点击下载</a>
                    </div>
                  </div>
                </a-card>
              </div>
              <!-- 音频消息 -->
              <div v-else-if="item.type === 'audio'">
                <audio :src="item.msg" controls></audio>
              </div>
              <!-- 视频消息 -->
              <div v-else-if="item.type === 'video'">
                <video :src="item.msg" width="100%" controls></video>
              </div>
              <!-- 聊天消息 -->
              <p
                style="user-select: text"
                v-else
                v-html="renderTxt(item.msg)"
                class="msg"
              />
            </div>
          </li>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import _ from 'lodash'
import WebIM from '../../utils/WebIM';
import emoji from '../../config/emoji';
import { renderTime, readablizeBytes } from '../../utils/index';
export default{
	data(){
		return {
			renderTime,
			readablizeBytes,
			showModal: false,
			showPopover: false,
			searchValue: '',
			msgObj: [],
		};
	},
	watch: {
		historyList: {
			handler(msgNewVal, msgOldVal){
				this.msgObj = _.reverse(msgNewVal);
			}
		}
	},
	computed: {
		...mapGetters({
			historyList: 'fetchHistoryMessages'
		})
	},
	methods: {
		...mapActions(['getHistoryMessage']),
		handleHistory(){
			this.showModal = !this.showModal;
			WebIM.conn.mr_cache = [];
			this.getHistoryMessage({
				name: this.type === 'contact' ? this.chatId.name : this.chatId.groupid,
				isGroup: this.type !== 'contact',
				isSearch: true
			});
		},
		handlerClose(){
			this.showModal = false;
			this.searchValue = ''
		},

		customEmoji(value){
			return `<img src="../../../static/faces/${value}" style="width:20px"/>`;
		},

		onSearch(e){
			let newMsgs = [];
			this.historyList.length && this.historyList.forEach(item => {
				if(item.type === 'txt'){
					newMsgs.push(item)
				}
			});
			this.msgObj = newMsgs.filter(item => item.msg && item.msg.includes(e));
		},
		onChangeInput(e){
			const { value } = e.target
			if(value.length === 0){
				this.msgObj = this.historyList;
			}
		},
		renderTxt(txt = ''){
			let rnTxt = [];
			let match = null;
			const regex = /(\[.*?\])/g;
			let start = 0;
			let index = 0;
			while((match = regex.exec(txt))){
				index = match.index;
				if(index > start){
					rnTxt.push(txt.substring(start, index));
				}
				if(match[1] in emoji.obj){
					const v = emoji.obj[match[1]];
					rnTxt.push(this.customEmoji(v));
				}
				else{
					rnTxt.push(match[1]);
				}
				start = index + match[1].length;
			}
			rnTxt.push(txt.substring(start, txt.length));
			return rnTxt.toString().replace(/,/g, '');
		}
	},
	props: [
		'type', // 聊天类型 contact, group, chatroom
		'chatId' // 选中的聊天对象
	]
};
</script>
<style scoped>
.info-style {
  display: flex;
  margin-top: 10px;
}
.name-style {
  margin-right: 20px;
}
.msg {
  list-style: none;
  background: #eceff1;
  text-align: left;
  margin: 5px 0 0 0;
  display: inline-block;
  padding: 13px 15px;
  margin-top: 11px;
  border-radius: 25px;
  border: 1px solid #eceff1;
  min-width: 100px;
  word-break: break-all;
}
</style>
