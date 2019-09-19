<template>
  <el-dialog title="黑名单" :visible.sync="showBlackModel">
    <div class="black-name">
      <ul v-for="item in fidendList" :key="item.name">
        {{item.name}}
        <i class="el-icon-remove-outline" @click="select(item)"></i>
      </ul>
    </div>
  </el-dialog>
</template>
<script>
import { mapActions } from "vuex";
import './firend.less'
export default {
  data() {
    return {
      showBlackModel: false
    };
  },
  computed: {
    fidendList() {
      return this.$store.state.friendModule.blackList;
    }
  },
  methods: {
    ...mapActions(["onGetFirendBlack","onRemoveBlack"]),
    changModel() {
      this.$data.showBlackModel = !this.$data.showBlackModel;
    },
    select(key) {
      let removeName = key.name;
      this.onRemoveBlack({
        removeName: removeName
      },
        this.onGetFirendBlack()
      );
    }
  }
};
</script>
<style scoped>
</style>