<template>
  <el-dialog title="创建群组" :visible.sync="showCreateGroupModel">
    <el-form :model="form" v-if="showCreateModel == true">
      <div>
        <el-input v-model="form.groName" placeholder="群组名称"></el-input>
      </div>
      <div class="groDesc">
        <el-input type="textarea" :rows="2" placeholder="简介" v-model="form.desc"></el-input>
      </div>
      <div class="groPub">
        <p>群组类型</p>
        <el-radio v-model="form.radio" label="0">私有群</el-radio>
        <el-radio v-model="form.radio" label="1">公有群</el-radio>
      </div>
      <div class="groPub">
        <p>加群权限</p>
        <el-radio v-model="form.radiopom" label="0">审批</el-radio>
        <el-radio v-model="form.radiopom" label="1">随便加</el-radio>
      </div>
      <div class="groPost">
        <el-button type="success" @click="chenageCreateModel">下一步</el-button>
      </div>
    </el-form>
    <div v-if="showFriendListModel == true">
      <div class="groPub">
        <el-checkbox-group v-model="form.membersList">
          <el-checkbox v-for="item in firendList" :key="item.name" :label="item.name"></el-checkbox>
        </el-checkbox-group>
        <!-- <ul v-for="item in firendList" :key="item.name">
        <input type="checkbox" v-model="form.membersList">
        {{item.name}}
        </ul>-->
      </div>
      <div>
        <div class="groBack" @click="chenageCreateModel">
          <i class="el-icon-back"></i>
          <i>返回</i>
        </div>
        <div class="groCreate">
          <el-button type="success" @click="postCreateGroup">创建群组</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>
<script>
import "./group.less";
import { mapActions } from "vuex";
export default {
  data() {
    return {
      showCreateGroupModel: false,
      showCreateModel: true,
      showFriendListModel: false,

      form: {
        groName: "",
        desc: "",
        radio: "1",
        radiopom: "1",
        membersList: []
      }
    };
  },
  computed: {
    firendList() {
      return this.$store.state.chat.userList.contactUserList || [];
    }
  },
  methods: {
    ...mapActions(["onCreateGroup"]),
    changeCreateModel() {
      this.$data.showCreateGroupModel = !this.$data.showCreateGroupModel;
      if (!this.$data.showCreateModel) {
        this.chenageCreateModel();
      }
      this.$data.form.groName = '';
      this.$data.form.desc = '';
    },
    chenageCreateModel() {
      this.$data.showCreateModel = !this.$data.showCreateModel;
      this.$data.showFriendListModel = !this.$data.showFriendListModel;
    },
    postCreateGroup() {
      this.onCreateGroup({
        groupname: this.$data.form.groName,
        desc: this.$data.form.desc,
        members: this.$data.form.membersList,
        approval: this.$data.form.radio == 1 ? true : false,
        pub: this.$data.form.radiopom == 1 ? true : false
      });
    }
  }
};
</script>
<style scoped>
</style>