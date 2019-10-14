<template>
  <div class="wrap">
    <el-form v-model="form">
      <el-form-item>
        <input
          type="button"
          @mousedown.prevent="mouseStart"
          @mouseup.prevent="mouseEnd('audio')"
          v-model="form.time"
        />
        <input
          value="语音识别"
          type="button"
          @mousedown.prevent="mouseStart"
          @mouseup.prevent="mouseEnd('turnText')"
        />
        <audio
          id="audioInput"
          v-if="audioSrc"
          :src="audioSrc"
          controls="controls"
          class="content-audio"
          style="display: block;"
        >语音</audio>
      </el-form-item>
    </el-form>
    <button v-on:click="11">播放</button>
  </div>
</template>

<script>
import recording from "./recordAudio.js";
import { mapActions } from "vuex";
export default {
  data() {
    return {
      form: {
        time: "按住说话(60秒)",
        audioUrl: ""
      },
      num: 60, // 按住说话时间
      recorder: null,
      interval: "",
      audioFileList: [], // 上传语音列表
      startTime: "", // 语音开始时间
      endTime: "", // 语音结束
      audioSrc: ""
    };
  },
  methods: {
    ...mapActions(["sendRecorder"]),
    // 清除定时器
    clearTimer() {
      if (this.interval) {
        this.num = 60;
        clearInterval(this.interval);
      }
    },
    // 长按说话
    mouseStart() {
      this.clearTimer();
      this.startTime = new Date().getTime();
      recording.get(rec => {
        // 当首次按下时，要获取浏览器的麦克风权限，所以这时要做一个判断处理
        if (rec) {
          // 首次按下，只调用一次
          if (this.flag) {
            this.mouseEnd();
            this.flag = false;
          } else {
            this.recorder = rec;
            this.interval = setInterval(() => {
              if (this.num <= 0) {
                this.recorder.stop();
                this.num = 60;
                this.clearTimer();
              } else {
                this.num--;
                this.time = "松开结束（" + this.num + "秒）";
                this.recorder.start();
              }
            }, 1000);
          }
        }
      });
    },

    // 松开时上传语音
    mouseEnd(type) {
      this.clearTimer();
      this.endTime = new Date().getTime();
      if (this.recorder) {
        this.recorder.stop();
        // 重置说话时间
        this.num = 60;
        this.time = "按住说话（" + this.num + "秒）";
        // 获取语音二进制文件
        let bold = this.recorder.getBlob();

        //发送语音功能
        if (type === "audio") {
          let input = document.getElementById('audioInput')
          this.$data.audioSrc = WebIM.utils.parseDownloadResponse.call(WebIM.conn, bold)
          const { name, params } = Vue.$route;
          this.sendRecorder({
            type: name,
            useId: params.id,
            input
          });
        }

        // 语音识别功能
        if (type === "turnText") {
          const apiURL = `https://mproxy.microduino.cn/baidu/asr`;
          let formData = new FormData();
          formData.append("file", bold);
          formData.append("format", "wav");
          formData.append("rate", 16000);

          let audioApi = fetch(apiURL, { method: "POST", body: formData })
            .then(response => {
              return response.json().then(json => ({ json, response }));
            })
            .then(({ json, response }) => {
              if (!response.ok) {
                return Promise.reject(json);
              }
              return json;
            });
          audioApi
            .then(res => {
              console.log("res>>>", res);
              let txt = JSON.stringify(res);
              console.log("txt=", txt);
            })
            .catch(err => {
              console.error("baidu api err = ", err);
            });
        }
      }
    }
  }
};
</script>