<template>
  <div class="modalWrap">
    <a-modal title="消息举报" :destroy-on-close="true" v-model="reportVisible">
      <p>请输入举报原因：</p>
      <br />
      <a-input
        type="textarea"
        placeholder="请输入举报原因："
        v-model="reason"
        :autosize="{ minRows: 2, maxRows: 5 }"
      >
      </a-input>
      <div slot="footer" class="dialog-footer">
        <a-button @click="onCancel">取 消</a-button>
        <a-button type="primary" @click="onOk">确 定</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  data() {
    return {
      reason: "" // 举报原因
    };
  },
  methods: {
    reportMessage() {
      WebIM.conn
        .reportMessage({
          reportType: "UserReport", // 用户主动上报。
          reportReason: this.reason, // 举报原因。
          messageId: this.$store.state.chat.reportMsgId
        })
        .then(() => {
          this.$message.success("举报成功");
        })
        .catch(() => {
          this.$message.error("举报失败");
        })
        .finally(() => {
          this.$store.commit("setReportMsgId", { messageId: 0 });
          this.reason = "";
        });
    },
    onCancel() {
      this.$store.commit("setReportMsgId", { messageId: 0 });
    },
    onOk() {
      if (this.reason) {
        this.$confirm({
          title: "确认举报该消息吗？",
          okText: "确定",
          cancelText: "取消",
          onOk: () => {
            this.reportMessage();
          }
        });
      } else {
        this.$message.info("请填写举报原因！");
      }
    }
  },
  computed: {
    ...mapState({
      reportVisible: state => !!state.chat.reportMsgId
    })
  }
};
</script>
