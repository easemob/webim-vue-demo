<template>
  <el-dialog title="群组黑名单" :visible.sync="showGroupBlackModel">
    <div>
      <ul v-for="index in groupBlackList" :key="index">
        {{index}}
        <label>
          <i class="el-icon-remove-outline" @click="select(index)"></i>
        </label>
      </ul>
    </div>
  </el-dialog>
</template>
<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      showGroupBlackModel: false
    };
  },
  computed: {
    groupBlackList() {
      return this.$store.state.group.groupBlack;
    }
  },
  methods: {
		...mapActions(["onRemoveGroupBlack"]),
    chengeBlackModel() {
      debugger;
      this.$data.showGroupBlackModel = !this.$data.showGroupBlackModel;
    },
    select(key) {
			console.log(key)
			let removeGroupBlackName = key;
			this.onRemoveGroupBlack({
				select_id: this.$store.state.group.groupInfo.gid,
				removeGroupName : removeGroupBlackName
			})
    }
  }
};
</script>
<style scoped>
</style>