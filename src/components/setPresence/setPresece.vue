<template>
  <div class="set-presence">
    <a-modal
      mask
      :centered="true"
      v-model="visible"
      :title="'设置状态'"
      cancelText="取消"
      okText="确定"
      @ok="handleOk"
      @cancel="hadleCancel">
      <div class="choose-modal">
        <div class="input-choose">
          <a-input size="large" style="width: 300px" v-model="selfStatus" placeholder="自己定义状态">
            <a-icon slot="suffix" @click="selfStatus = ''" type="close-circle" />
          </a-input>
        </div>
        <!-- <a-select size="large" placeholder="自定义状态期限" style="width: 300px" @change="handleChange">
          <a-select-option v-for="i in selectOption" :key="i.value">
            {{i.title}}
          </a-select-option>
        </a-select> -->
      </div>
    </a-modal>
  </div>
</template>

<script>
import './setPresence.less'
import { mapActions } from 'vuex'
export default{
	data(){
		return {
			visible: false,
			selfStatus: '',
			selectValue: 0,
			selectOption: [
				{
					title: 'Don\'t Clear',
					value: 0
				},
				{
					title: 'Clear in 1 hour',
					value: 1
				},
				{
					title: 'Clear in 8 hour',
					value: 2
				},
				{
					title: 'Clear Tomorow',
					value: 3
				}
			]
		}
	},
	methods: {
		...mapActions(['publishNewPresence', 'subFriendStatus', 'unsubFriendStatus', 'getSubPresence']),
		showModal(){
			this.visible = true
		},
		handleOk(){
			if(!this.selfStatus){
				this.$message.error('自定义状态不能为空')
				return
			}
			const params = {
				// data: this.selectOption[this.selectValue],
				description: this.selfStatus
			}
			this.$emit('changePresence', params)
			// this.publishNewPresence(params)
			// params.usernames = JSON.parse(localStorage.getItem("userInfo")).userId === 'luleiyu' ? ['lu1'] : ['luleiyu']
			// this.subFriendStatus(params)
			// this.unsubFriendStatus(params)
			// this.getSubPresence(params)
			this.hadleCancel()
		},
		hadleCancel(){
			this.visible = false
		},
		handleChange(value){
			this.selectValue = value
		}
	}
}
</script>
