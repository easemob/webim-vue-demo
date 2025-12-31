import "./assets/main.css";
// import 'easemob-chat-uikit/style.css'
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createRoot } from "react-dom/client";
import { setVeauryOptions } from "veaury";

setVeauryOptions({
  react: {
    createRoot
  }
});

const app = createApp(App);

app.use(router);

app.mount("#app");
