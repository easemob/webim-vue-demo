<template>
  <div>
    <el-dialog title="请求添加好友" :visible="this.isShowFriendRequest">
      <p :class="$style.p">{{this.$store.state.friendModule.friendRequest.status}}</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="refusedClick">拒绝</el-button>
        <el-button type="primary" @click="acceptSubmit">接受</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import Vue from "vue";

export default {
  data() {
    return {
      showRequestFriendModal: this.$store.state.friendModule.friendRequest
        .isShow
    };
  },
  computed: {
    // ...mapGetters({

    // }),
    isShowFriendRequest() {
        console.log('this.$store.state>>>',this.$store.state);
        
      return this.$store.state.friendModule.friendRequest.isShow;
    }
  },

  methods: {
    ...mapActions(["acceptSubscribe", "declineSubscribe"]),
    changeModal() {
      this.$store.state.friendModule.friendRequest.isShow = !this.$store.state
        .friendModule.friendRequest.isShow;
    },
    acceptSubmit() {
        console.log('this.$store.state.friendModule>>>',this.$store.state.friendModule)
        
      const id = this.$store.state.friendModule.friendRequest.from;
      this.acceptSubscribe(id);
      this.changeModal();
    },
    refusedClick() {
      console.log(this.$store.state);

      const options = {
        id: this.$store.state.friendModule.friendRequest.to,
        params: this.$route.query.username
      };
        this.declineSubscribe(options);
      this.changeModal();
    }
  }
};
</script>
<style module>
.p {
  text-align: center;
}
</style>
