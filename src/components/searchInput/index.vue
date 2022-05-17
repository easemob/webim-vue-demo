<script setup>
import { onMounted, ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
const state = ref('');
const links = ref([]);

const loadAll = () => {
  return [
    { value: 'vue', link: 'https://github.com/vuejs/vue' },
    { value: 'element', link: 'https://github.com/ElemeFE/element' },
    { value: 'cooking', link: 'https://github.com/ElemeFE/cooking' },
    { value: 'mint-ui', link: 'https://github.com/ElemeFE/mint-ui' },
    { value: 'vuex', link: 'https://github.com/vuejs/vuex' },
    { value: 'vue-router', link: 'https://github.com/vuejs/vue-router' },
    { value: 'babel', link: 'https://github.com/babel/babel' },
  ];
};
let timeout;
const querySearchAsync = (queryString, cb) => {
  const results = queryString
    ? links.value.filter(createFilter(queryString))
    : links.value;

  clearTimeout(timeout);
  timeout = setTimeout(() => {
    cb(results);
  }, 3000 * Math.random());
};

const createFilter = (queryString) => {
  return (restaurant) => {
    return (
      restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    );
  };
};

const handleSelect = (item) => {
  console.log(item);
};

onMounted(() => {
  links.value = loadAll();
});
</script>
<template>
  <el-autocomplete
    style="width: 100%"
    v-model="state"
    :fetch-suggestions="querySearchAsync"
    placeholder="搜索"
    @select="handleSelect"
  >
    <template #suffix>
      <el-icon class="el-input__icon">
        <Search />
      </el-icon>
    </template>
  </el-autocomplete>
</template>

<style lang="scss" scoped></style>
