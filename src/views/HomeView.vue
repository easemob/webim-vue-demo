<script setup>
import { ref } from "vue";
import { applyPureReactInVue } from "veaury";
import EaseChat from "../react_app/chat";
import Logo from "../assets/logo.svg";

const Chat = applyPureReactInVue(EaseChat);

const theme = ref("light");

const switchTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
};
</script>

<template>
  <header>
    <div class="header">
      <img class="logo" :src="Logo" alt="logo" />
      <span class="theme" @click="switchTheme">Switch Theme: {{ theme }}</span>
    </div>
  </header>
  <main>
    <Chat :theme="theme" />
  </main>
</template>

<style>
body {
  margin: 0;
}

.chat-wrap {
  width: 100%;
  height: calc(100vh - 50px);
  display: flex;
  box-sizing: border-box;
}

.conversation-list {
  width: 300px;
  flex-shrink: 0;
}

.chat {
  width: 100%;
}
</style>

<style scoped>
.header {
  display: flex;
  height: 50px;
  font-size: 20px;
  background: #4faeea;
  padding: 0 20px;
  align-items: center;
  justify-content: space-between;
}

.theme {
  cursor: pointer;
}

.logo {
  width: 45px;
}
</style>
