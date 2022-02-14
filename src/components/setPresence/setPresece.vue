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
        状态选择：
        <div class="radio-choose">
          <a-radio-group v-model="value">
            <a-radio
              v-for="item in statusList"
              :key="item.title"
              :value="item.value">
              {{item.title}}
            </a-radio>
          </a-radio-group>
        </div>
        <div v-show="value === 5" class="input-choose">
          <a-input v-model="selfStatus" placeholder="没有满意的状态，可以自己定义"></a-input>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import './setPresence.less'
import { mapActions } from 'vuex'
export default {
  data () {
    return {
      visible: false,
      value: 1,
      selfStatus: '',
      statusList: [
        {
          title: '离线',
          value: 0
        },
        {
          title: '在线',
          value: 1
        },
        {
          title: '离开',
          value: 2
        },
        {
          title: '隐身',
          value: 3
        },
        {
          title: '忙碌',
          value: 4
        },
        {
          title: '自定义',
          value: 5
        }
      ]
    }
  },
  methods: {
    ...mapActions(['publishNewPresence', 'subFriendStatus', 'unsubFriendStatus', 'getSubPresence']),
    showModal () {
      this.visible = true
    },
    handleOk () {
      if (!this.selfStatus && this.value === 5) {
        this.$message.error('自定义状态不能为空')
        return
      }
      const params = {
        presenceStatus: this.value,
        ext: '',
        to: 'lu1',
        message: 'message'
      }
      if (this.value === 5) {
        params.ext = this.selfStatus
        params.message = this.selfStatus
      } else {
        params.ext = ''
      }
      let data = ''
      this.statusList.forEach(item => {
        if (item.value === this.value) {
          data = item
        }
      })
      this.$emit('changePresence', data)
      this.publishNewPresence(params)
      params.members = ['1','2','3','4']
      this.subFriendStatus(params)
      this.unsubFriendStatus(params)
      this.getSubPresence(params)
      this.hadleCancel()
    },
    hadleCancel () {
      this.visible = false
    }
  }
}
</script>