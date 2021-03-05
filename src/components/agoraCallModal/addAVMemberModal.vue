<template>
  <Draggable>
    <div class="multi-webim-rtc">
      <el-row :gutter="2">
        <el-col :span="span" v-for="item in videos" :key="item.name">
          <div class="default" :id="`video${item.name}`"></div>
          <div class="user-name">
            <span>{{ item.name || "" }}</span>
          </div>
          <!-- <div class="{talking}">
            <img src="{talkingicon}" alt="" />
          </div> -->
        </el-col>
      </el-row>
      <p class="video-duration">{{ time }}</p>
      <div class="action-wrap">
        <div class="tools_p">
          <img
            v-if="aoff"
            src="../../../static/img/microphone-mute@2x.png"
            alt=""
            @click="open_mic"
          />
          <img
            v-else
            src="../../../static/img/microphone@2x.png"
            alt=""
            @click="close_mic"
          />
          <p>语音</p>
        </div>
        <div class="tools_p">
          <img
            src="../../../static/img/hangupCall@2x.png"
            alt=""
            @click="closeModal"
          />
          <p>挂断</p>
        </div>
        <div class="tools_p">
          <img
            v-if="voff"
            src="../../../static/img/camera-close@2x.png"
            alt=""
            @click="open_camera"
          />
          <img
            v-else
            src="../../../static/img/camera@2x.png"
            alt=""
            @click="close_camera"
          />
          <p>视频</p>
        </div>
      </div>
    </div>
  </Draggable>
</template>

<script>
import "./webrtc.less";
import Draggable from "../draggable";
import WebIM from "../../utils/WebIM";
import { mapActions, mapGetters } from "vuex";
const rtc = WebIM.rtc;
const AgoraRTC = WebIM.AgoraRTC;
export default {
  data() {
    return {
      aoff: false,
      voff: false,
      hour: 0,
      minute: 0,
      second: 0,
      span: 12,
      isTalting: [],
    };
  },

  computed: {
    time() {
      return this.$store.state.agora.callDuration;
    },
    onJoin() {
      return this.$store.state.agora.callStatus;
    },
    videos() {
      let { joinedMembers, invitedMembers } = this.$store.state.agora;
      console.log(
        "joinedMembers>>",
        joinedMembers,
        "invitedMembers>>",
        invitedMembers
      );
      let a = joinedMembers.concat(invitedMembers);
      console.log("a>>>>>>", a);
      return joinedMembers.concat(invitedMembers);
    },
  },
  watch: {
    onJoin() {
      let { callStatus, confr } = this.$store.state.agora;
      if (callStatus === 3 && !confr.calleeDevId) {
        this.join();
      }
    },
  },

  mounted() {
    rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    this.addListener();
    this.interval();

    let {
      joinedMembers,
      invitedMembers,
      callStatus,
      confr,
    } = this.$store.state.agora;
    let videos = joinedMembers.concat(invitedMembers);
    if (videos.length > 4) {
      this.span = 6;
    } else {
      this.span = 12;
    }
  },

  beforeDestroy() {
    this.intervalID && clearInterval(this.intervalID);
  },

  methods: {
    ...mapActions([
      "updateConfr",
      "setCallStatus",
      "hangup",
      "cancelCall",
      "setCallDuration",
      "getRtctoken",
      "setJoinedMembers",
      "updateJoinedMembers",
      "setInvitedMembers",
    ]),
    video_class(item) {
      let joining = item ? "" : "joining";
      let newClass = "default" + joining;
      console.log("newClass>>", newClass);
      return newClass;
    },

    addListener() {
      rtc.client.on("user-published", async (user, mediaType) => {
        console.log("有远端画面 -------- ");
        console.log(user, mediaType);
        // 开始订阅远端用户。
        await rtc.client.subscribe(user, mediaType);

        console.log("subscribe success");

        let { joinedMembers } = this.$store.state.agora;
        let videoElm = "";
        let exist = false;

        if (joinedMembers.length > 4) {
          this.span = 6;
        } else {
          this.span = 12;
        }

        joinedMembers.forEach((item, index) => {
          console.log("item>>", item);
          if (item.name === user.uid) {
            exist = true;
          }
        });

        let joined = {};
        if (!exist) {
          joined = {
            name: user.uid,
            videoElm: "video" + user.uid,
            type: mediaType,
            value: user.uid,
          };
          videoElm = "video" + user.uid;
          this.setJoinedMembers(joined);
        }

        // 表示本次订阅的是视频。
        if (mediaType === "video") {
          // 订阅完成后，从 `user` 中获取远端视频轨道对象。
          const remoteVideoTrack = user.videoTrack;
          // 也可以只传入该 DIV 节点的 ID。
          let videoBox = videoElm
            ? videoElm
            : joinedMembers.filter((item) => item.name == user.uid)[0].videoElm;
          setTimeout(() => {
            remoteVideoTrack.play(videoBox);
          }, 100);
        }

        // 表示本次订阅的是音频。
        if (mediaType === "audio") {
          // 订阅完成后，从 `user` 中获取远端音频轨道对象。
          const remoteAudioTrack = user.audioTrack;
          // 播放音频因为不会有画面，不需要提供 DOM 元素的信息。
          remoteAudioTrack.play();
        }
      });

      // 监听远端取消发布
      rtc.client.on("user-unpublished", (user, mediaType) => {
        console.log("取消发布了");
      });

      rtc.client.on("user-left", (user) => {
        console.log("-- 对方已离开 ---", user);

        this.updateJoinedMembers({ name: user.uid });

        let { joinedMembers } = this.$store.state.agora;

        if (joinedMembers.length < 2) {
          this.hangup();
        }

        if (joinedMembers.length > 4) {
          this.span = 6;
        } else {
          this.span = 12;
        }
      });

      rtc.client.enableAudioVolumeIndicator();
      rtc.client.on("volume-indicator", (result) => {
        let isTalting = [...this.$data.isTalting];
        result.forEach((volume, index) => {
          //console.log(`**** ${index} UID ${volume.uid} Level ${volume.level} ***`);
          if (volume.level > 1 && !isTalting.includes(volume.uid)) {
            isTalting.push(volume.uid);
          } else {
            if (volume.level < 1 && isTalting.includes(volume.uid)) {
              let i = isTalting.indexOf(volume.uid);
              isTalting.splice(i, 1);
            }
          }
        });
        this.isTalting = isTalting;
      });
    },

    async join() {
      const appId = "15cb0d28b87b425ea613fc46f7c9f974";
      let { confr } = this.$store.state.agora;
      let imUserName = WebIM.conn.context.jid.name;
      let params = {
        username: imUserName,
        channelName: confr.channel,
        appkey: WebIM.conn.appKey,
      };
      console.log("params>>>>", params);
      const { accessToken } = await this.getRtctoken(params);
      const uid = await rtc.client.join(
        appId,
        confr.channel,
        accessToken,
        imUserName
      );

      // 通过麦克风采集的音频创建本地音频轨道对象。
      rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      // 通过摄像头采集的视频创建本地视频轨道对象。
      rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
      // 将这些音视频轨道对象发布到频道中。
      await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);
      let { joinedMembers, invitedMembers } = this.$store.state.agora;
      console.log(
        "joinedMembers>>",
        joinedMembers,
        "invitedMembers>>",
        invitedMembers
      );
      console.log("publish success! --- ");
      let videoElm = "video" + WebIM.conn.context.jid.name;
      this.setJoinedMembers({
        videoElm: videoElm,
        name: imUserName,
        type: "video",
      });
      setTimeout(() => {
        rtc.localVideoTrack.play(videoElm);
      }, 500);
    },

    closeModal() {
      console.log("挂断");
      const { invitedMembers, callStatus } = this.$store.state.agora;
      let members = [...invitedMembers];
      if ([1, 3].includes(callStatus)) {
        members.forEach((item) => {
          console.log("members>>", members);
          this.cancelCall({ to: item });
        });
      }

      this.hangup();
    },

    interval() {
      let hour = 0,
        minute = 0,
        second = 0;
      this.intervalID = setInterval(() => {
        second += 1;
        if (second === 60) {
          second = 0;
          minute += 1;
          if (minute === 60) {
            minute = 0;
            hour += 1;
            if (hour == 24) {
              hour = 0;
            }
          }
        }
        let time = this.loadTime(hour, minute, second);
        this.setCallDuration(time);
      }, 1000);
    },
    loadTime(hour, minute, second) {
      const n2s = (n) => {
        let s = "";
        if (n >= 0 && n < 10) {
          s = "0" + n;
        } else {
          s = n + "";
        }
        return s;
      };
      let str = "";
      let hs = n2s(hour),
        ms = n2s(minute),
        ss = n2s(second);
      str = hs == "00" ? ms + ":" + ss : hs + ":" + ms + ":" + ss;
      return str;
    },
    addMember() {
      this.$emit("show_add_member_modal");
    },

    open_mic() {
      this.aoff = false;
      rtc.localAudioTrack.setEnabled(true);
    },
    close_mic() {
      this.aoff = true;
      rtc.localAudioTrack.setEnabled(false);
    },

    open_camera() {
      this.voff = false;
      rtc.localVideoTrack.setEnabled(true);
    },
    close_camera() {
      this.voff = true;
      rtc.localVideoTrack.setEnabled(false);
    },
  },

  components: {
    Draggable,
  },
};
</script>

