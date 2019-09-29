<template>
  <el-dialog title="申请入群" :visible.sync="showGroupModel">
    <div>
      <input class="searchInput" v-model="groupId" placeholder="请输入群组ID" />
    </div>
    <div>
      <el-button class="searchBtn" type="success" @click="getGroupinfo">搜索</el-button>
    </div>
    <div class="pubGroup" v-if="showGroupListModel == true">
      <ul
        class="groupList"
        v-for="item in publicGroupList"
        :key="item.groupid"
        :title="item.groupid"
        @click="select(item)"
      >{{item.groupname}}</ul>
    </div>
    <div v-if="showGroupInfoModel == true" class="info">
      <div>
        <span class="infoTitle">群组名称</span>
        <span class="infoContent">{{publicGroupInfo.name}}</span>
      </div>
      <div>
        <span class="infoTitle">管理员</span>
        <span class="infoContent">{{publicGroupInfo.admin}}</span>
      </div>
      <div>
        <span class="infoTitle">简介</span>
        <span class="infoContent">{{publicGroupInfo.desc || '空'}}</span>
      </div>
      <div>
        <span class="infoTitle">审批</span>
        <span class="infoContent">{{publicGroupInfo.membersonly ? '[Y]' : '[N]'}}</span>
      </div>
      <div>
        <div class="groBack" @click="changeGroupListModel">
          <i class="el-icon-back"></i>
          <i>返回</i>
        </div>
        <div class="groCreate">
          <el-button type="success" @click="postJoinGroup">申请加群</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>
<script>
import "./group.less";
import { mapActions, mapGetters } from "vuex";
import Vue from "vue";
export default {
  data() {
    return {
      groupId:  "",
      select_groupid: "",
      showGroupModel: false,
      showGroupInfoModel: false,
      showGroupListModel: true
    };
  },
  computed: {
    publicGroupList() {
      return this.$store.state.group.publicGroupList;
    },
    publicGroupInfo() {
      return this.$store.state.group.groupInfo;
    }
  },
  methods: {
    ...mapActions([
      "onGetGroupUserList",
      "onGetPublicGroup",
      "onGetGroupinfo",
      "onJoinGroup",
      "onGetGroupUserList"
    ]),
    open() {
      this.$message("申请加入群组成功，等待群管理员审批");
    },
    changeGroupModel() {
      this.$data.showGroupModel = !this.$data.showGroupModel;
      if (!this.$data.showGroupListModel) {
        this.changeGroupListModel();
      }
      this.$data.groupId = "";
      this.getPublicGroup();
    },
    changeGroupListModel() {
      this.$data.showGroupListModel = !this.$data.showGroupListModel;
      this.$data.showGroupInfoModel = !this.$data.showGroupInfoModel;
    },
    // chanegGroupInfoModel(){
    //   this.$data.showGroupInfoModel = !this.$data.showGroupInfoModel
    // },
    getPublicGroup() {
      this.onGetPublicGroup();
    },
    getGroupinfo() {
      this.onGetGroupinfo({
        groupid: this.$data.groupId
      });
      this.changeGroupListModel();
      // this.chanegGroupInfoModel()
    },
    postJoinGroup() {
      this.onJoinGroup({
        groupId: this.$data.groupId
      });
      this.open();
      this.onGetGroupUserList();
    },
    select(key) {
      this.$data.groupId = key.groupid;
      // console.log(this.$data.elect_groupid);
      this.getGroupinfo();
    }
  }
};
</script>
<style>
</style>