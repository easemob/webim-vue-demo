<template>
  <el-drawer
    title="群组信息"
    :modal="true"
    :append-to-body="true"
    :visible.sync="showGroupInfoModel"
    lable="rtl"
    style="margin-top: 95px; list-style-type:none"
    :wrapperClosable="true"
  >
    <div class="info-modal">
      <div>
        <h3>
          <i class="groInfoName">群组名称</i>
        </h3>
        <span>{{groupinfoList.name}}</span>
      </div>
      <div>
        <div>
          <h3>群组成员</h3>
        </div>
        <div>
          <table>
            <tr
              v-for="(item,index) in groupinfoList.members"
              id="index"
              :key="index"
              @click="select(item)"
            >
              <td class="info-name">{{item.member}}</td>
              <td v-if="!item.owner && username == groupinfoList.admin" class="info-icon">
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="setAdminIcon"
                  placement="bottom-start"
                  v-show="!showAdminIcon"
                >
                  <i class="el-icon-top" @click="openSetAdmin"></i>
                </el-tooltip>
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="removeAdminIcon"
                  placement="bottom-start"
                  v-show="showAdminIcon"
                >
                  <i class="el-icon-bottom" @click="openRemoveAdmin"></i>
                </el-tooltip>
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="setMute"
                  placement="bottom-start"
                  v-show="!showMuteIcon"
                >
                  <i class="el-icon-lock" @click="openSetMute"></i>
                </el-tooltip>
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="removeMute"
                  placement="bottom-start"
                  v-show="showMuteIcon"
                >
                  <i class="el-icon-unlock" @click="openRemoveMute"></i>
                </el-tooltip>
                <el-tooltip class="item" effect="dark" :content="setBlack" placement="bottom-start">
                  <i class="el-icon-warning-outline" @click="openGroupBlack"></i>
                </el-tooltip>
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="setRemove"
                  placement="bottom-start"
                >
                  <i class="el-icon-circle-close" @click="openRemoveGroupUser"></i>
                </el-tooltip>
              </td>
            </tr>
            <span>{{groupinfoList.admin}}</span>
          </table>
        </div>
      </div>
    </div>
    <GetGroupSetting ref="groupSettingModel" />
  </el-drawer>
</template>

<script>
import { mapActions } from "vuex";
import GetGroupSetting from "./groupSetting.vue";
import "./group.less";
export default {
  data() {
    return {
      select_id: "",
      select_name: "",
      //控制群组详情页
      showGroupInfoModel: false,
      //控制详情页图标
      showInfoIcon: false,
      //控制setAdmin图标
      showAdminIcon: false,
      //控制setMute 图标
      showMuteIcon: false,

      setAdminIcon: "设为管理员",
      removeAdminIcon: "移除管理员",
      setMute: "禁言",
      removeMute: "移除禁言",
      setBlack: "加入群黑名单",
      setRemove: "从本群移除"
    };
  },
  computed: {
    groupinfoList() {
      return this.$store.state.group.groupInfo;
    },
    username() {
      return this.$store.state.login.username;
    }
  },
  methods: {
    ...mapActions([
      "onGetGroupinfo",
      "onSetAdmin",
      "onRemoveAdmin",
      "onAddMute",
      "onRemoveMute",
      "onAddGroupBlack",
      "onRemoveGroupUser"
    ]),

    chengeInfoModel() {
      this.$data.showGroupInfoModel = !this.$data.showGroupInfoModel;
      if (this.$data.showSettingModel) {
        this.chengeSetModel();
      }
    },
    chengeSetModel() {
      this.$refs.groupSettingModel.changeSettingModel();
    },
    chengeAdminIcon() {
      this.$data.showAdminIcon = !this.$data.showAdminIcon;
    },
    chengeMuteIcon() {
      this.$data.showMuteIcon = !this.$data.showMuteIcon;
    },

    select(key) {
      console.log(key);
      this.$data.select_name = key.member;
    },
    openSetAdmin() {
      this.$confirm("确认操作: 设为管理员", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.onSetAdmin({
            select_id: this.$store.state.group.groupInfo.gid,
            select_name: this.$data.select_name
          });
          this.chengeAdminIcon();
          this.$message({
            type: "success",
            message: "设置管理员成功"
          });
        })
        .catch(() => {});
    },
    openRemoveAdmin() {
      this.$confirm("确认操作: 移除管理员", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.onRemoveAdmin({
            select_id: this.$store.state.group.groupInfo.gid,
            select_name: this.$data.select_name
          });
          this.chengeAdminIcon();
          this.$message({
            type: "success",
            message: "移除管理员成功"
          });
        })
        .catch(() => {});
    },
    openSetMute() {
      this.$confirm("确认操作: 禁言", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.onAddMute({
            select_id: this.$store.state.group.groupInfo.gid,
            select_name: this.$data.select_name
          });
          this.chengeMuteIcon();
          this.$message({
            type: "success",
            message: "禁言成功"
          });
        })
        .catch(() => {});
    },
    openRemoveMute() {
      this.$confirm("确认操作: 移除禁言", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.onRemoveMute({
            select_id: this.$store.state.group.groupInfo.gid,
            select_name: this.$data.select_name
          });
          this.chengeMuteIcon();
          this.$message({
            type: "success",
            message: "移除禁言列表成功"
          });
        })
        .catch(() => {});
    },
    openGroupBlack() {
      this.$confirm("确认操作: 加入群黑名单", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.onAddGroupBlack({
            select_id: this.$store.state.group.groupInfo.gid,
            select_name: this.$data.select_name
          });
          this.chengeMuteIcon();
          this.$message({
            type: "success",
            message: "加入群黑名单成功"
          });
        })
        .catch(() => {});
    },
    openRemoveGroupUser() {
      this.$confirm("确认操作: 从本群移除", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.onRemoveGroupUser({
            select_id: this.$store.state.group.groupInfo.gid,
            select_name: this.$data.select_name
          });
          this.chengeMuteIcon();
          this.$message({
            type: "success",
            message: "移除成员成功"
          });
        })
        .catch(() => {});
    }
  },
  components: {
    GetGroupSetting
  }
};
</script>
<style scoped>
.info-modal {
  padding-left: 10px;
  /* cursor: pointer; */
}
.setting-icon {
  position: absolute;
  right: 30px;
}
.info-icon {
  position: absolute;
  right: 30px;
  cursor: pointer;
  overflow: hidden;
}
.info-name ::selection {
  width: 40px;
  background: #00ba6e;
}
.info-setting {
  list-style-type: none;
  text-align: left;
  padding-left: 0;
  /* position: absolute;
  right: 30px; */
}
</style>