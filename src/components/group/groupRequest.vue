<template>
  <!-- <el-dialog title="申请入群" :visible="this.isShowGroupReques.isShow">
    <p>{{this.$store.state.group.groupNotifications.from}}申请入群</p>
    <div slot="footer" class="dialog-footer">
      <el-button @click="RejectJoinGroup">拒绝</el-button>
      <el-button type="primary" @click="AgreeJoinGroup">同意</el-button>
    </div>
  </el-dialog>-->
  <a-modal
    title="申请入群"
    :visible="this.isShowGroupReques.isShow"
    :footer="null"
    style="text-align:center"
  >
    <p>{{this.$store.state.group.groupNotifications.from}}申请入群:{{this.$store.state.group.groupNotifications.gid}}</p>
    <div class="btn">
      <el-button @click="RejectJoinGroup">拒绝</el-button>
      <el-button type="primary" @click="AgreeJoinGroup">同意</el-button>
    </div>
  </a-modal>
</template>
<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      showGroupRequestModel: this.$store.state.group.groupNotifications.isShow
    };
  },
  computed: {
    isShowGroupReques() {
      return this.$store.state.group.groupNotifications;
    }
  },
  methods: {
    ...mapActions(["onAgreeJoinGroup", "onRejectJoinGroup"]),
    changeGroupRequestModal() {
      this.$store.state.group.groupNotifications.isShow = !this.$store.state
        .group.groupNotifications.isShow;
    },
    AgreeJoinGroup() {
      this.onAgreeJoinGroup({
        joinName: this.$store.state.group.groupNotifications.from,
        joinGroupId: this.$store.state.group.groupNotifications.gid
      });
      this.changeGroupRequestModal();
    },
    RejectJoinGroup() {
      this.onRejectJoinGroup({
        joinName: this.$store.state.group.groupNotifications.from,
        joinGroupId: this.$store.state.group.groupNotifications.gid
      });
      this.changeGroupRequestModal();
    }
  }
};
</script>
<style scoped>
p {
  font-size: 18px;
}
.btn {
  margin-top: 20px;
}
</style>>
    
