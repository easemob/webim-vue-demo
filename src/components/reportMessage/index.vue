<template>
  <div class="modalWrap">
    <a-modal title="消息举报" :destroy-on-close="true" v-model="reportVisible">
      <p>请选择举报类型：</p>
      <br />
      <a-select v-model="reportType" class="typeSelect">
        <a-select-option
          v-for="item in reportTypeList"
          :key="item.key"
          :value="item.value"
        >
          {{ item.value }}
        </a-select-option>
      </a-select>
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
const ReportType = [
  {
    key: "1",
    value: "涉政"
  },
  {
    key: "2",
    value: "涉黄"
  },
  {
    key: "3",
    value: "广告"
  },
  {
    key: "4",
    value: "辱骂"
  },
  {
    key: "5",
    value: "暴恐"
  },
  {
    key: "6",
    value: "违禁"
  },
  {
    key: "7",
    value: "其他"
  }
];
export default {
  data() {
    return {
      reason: "", // 举报原因
      reportType: "涉政", // 举报类型
      reportTypeList: ReportType // 举报类型list
    };
  },
  methods: {
    reportMessage() {
      WebIM.conn
        .reportMessage({
          reportType: this.reportType, // 举报类型
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
    reportVisible: {
      get() {
        return !!this.$store.state.chat.reportMsgId;
      },
      set() {
        this.$store.commit("setReportMsgId", { messageId: 0 });
      }
    }
  }
};
</script>

<style lang="less" scoped>
.typeSelect {
  width: 100%;
  margin-bottom: 10px;
}
</style>
