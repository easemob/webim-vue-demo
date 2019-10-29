<template>
    <Draggable v-if="multiAVModalVisible" id="drag3">
        <div class="multiAVModal" v-show="multiAVModalVisible">
            <span class="title">{{to.groupname}}</span>
            <!-- <div>时间</div> -->
            <el-row type="flex" class="row-bg" justify="space-around">
                <el-col :span="6"><div class="grid-content bg-purple videoBox">
                    <video class="video" autoPlay playsInline muted ref="rv_local"/>
                    <div class="tools">
                        <span>{{rv_local.nickName}}</span>
                    </div>
                </div></el-col>
                <el-col :span="6"><div class="grid-content bg-purple-light videoBox">
                    <video class="video" autoPlay playsInline ref="rv_0"/>
                    <div class="tools">
                        <span>{{rv[0].nickName}}</span>
                        <i class="el-icon-video-camera red" @click="controlRemoteVideo(0)"></i>
                    </div>
                </div></el-col>
                <el-col :span="6"><div class="grid-content bg-purple videoBox">
                    <video class="video" autoPlay playsInline ref="rv_1"/>
                    <div class="tools">
                        <span>{{rv[1].nickName}}</span>
                        <i class="el-icon-video-camera red" @click="controlRemoteVideo(1)"></i>
                    </div>
                </div></el-col>
            </el-row>
            <el-row type="flex" class="row-bg" justify="space-around">
                <el-col :span="6"><div class="grid-content bg-purple videoBox">
                    <video class="video" autoPlay playsInline ref="rv_2"/>
                    <div class="tools">
                        <span>{{rv[2].nickName}}</span>
                        <i class="el-icon-video-camera red" @click="controlRemoteVideo(2)"></i>
                    </div>
                </div></el-col>
                <el-col :span="6"><div class="grid-content bg-purple-light videoBox">
                    <video class="video" autoPlay playsInline ref="rv_3"/>
                    <div class="tools">
                        <span>{{rv[3].nickName}}</span>
                        <i class="el-icon-video-camera red" @click="controlRemoteVideo(3)"></i>
                    </div>
                </div></el-col>
                <el-col :span="6"><div class="grid-content bg-purple videoBox">
                    <video class="video" autoPlay playsInline ref="rv_4"/>
                    <div class="tools">
                        <span>{{rv[4].nickName}}</span>
                        <i class="el-icon-video-camera red" @click="controlRemoteVideo(4)"></i>
                    </div>
                </div></el-col>
            </el-row>
            <div class="toolsBox">
                <el-col :span="3"><i class="el-icon-circle-plus-outline toolBtn" @click="invite"></i></el-col>
                <!-- <el-col :span="3"><i class="el-icon-phone-outline toolBtn"></i></el-col> -->
                <el-col :span="3"><i :class="rv_local.openAudio?'el-icon-microphone toolBtn':'el-icon-microphone active'" @click="controlLocalMic"></i></el-col>
                <el-col :span="3"><i :class="rv_local.openVideo?'el-icon-video-camera toolBtn':'el-icon-video-camera active'" @click="controlLocalVideo"></i></el-col>
				<a-button type="danger" plain @click="closeModal">挂断</a-button>
            </div>
        </div>
    </Draggable>
</template>
<script>
import { mapActions, mapGetters } from "vuex";
import Draggable from "../draggable";
export default{
	data(){
		return {
			// emediaModalVisible: false
			rv_local: {
				nickName: "",
				streamId: "",
				openAudio: false,
				openVideo: false,
				video: <div className="default"></div>
			},
			rv: new Array(5).fill({
				nickName: "",
				streamId: "",
				openVideo: false,
				video: <div className="default"></div>
			}),
			rvCount: 0,
		};
	},
	props: [
		"to"
	],
	computed: {
		multiAVModalVisible(){
			return this.$store.state.emedia.multiAVModalVisible;
		},
		addAVMemberModalVisible(){
			return this.$store.state.emedia.addAVMemberModalVisible;
		}
	},
	mounted(){
		this.initEmedia();
	},
	methods: {
		...mapActions([
			"showMultiAVModal",
			"hideMultiAVModal",
			"setConfr",
			"setAVMemeberModalVisible"
		]),
		initEmedia(){
			let me = this;

			WebIM.EMService = emedia.mgr;
			WebIM.EMService.onConferenceExit = function(reason, failed){
				reason = reason || 0;
				switch(reason){
				case 0:
					reason = "正常挂断";
					break;
				case 1:
					reason = "没响应";
					break;
				case 2:
					reason = "服务器拒绝";
					break;
				case 3:
					reason = "对方忙";
					break;
				case 4:
					reason = "失败,可能是网络或服务器拒绝";
					if(failed === -9527){
						reason = "失败,网络原因";
					}
					if(failed === -500){
						reason = "Ticket失效";
					}
					if(failed === -502){
						reason = "Ticket过期";
					}
					if(failed === -504){
						reason = "链接已失效";
					}
					if(failed === -508){
						reason = "会议无效";
					}
					break;
				case 5:
					reason = "不支持";
					break;
				case 10:
					reason = "其他设备登录";
					break;
				case 11:
					reason = "会议关闭";
					break;
				default:
					break;
				}
				console.log("Hangup reason " + (reason || 0));
			};

			WebIM.EMService.onMemberJoined = function(member){
				me.$message.success(member.name + " 加入群聊.");
				// me.props.setJoinedMembers(member)
			};
			WebIM.EMService.onMemberExited = function(member, reason){
				// me.removeVideo(member.name)

				// 用户主动挂断时，不提示退出群聊
				if(reason !== undefined){
					me.$message.warning(member.name + " 退出群聊.");
				}
				// me.props.updateJoinedMembers(member)
			};

			WebIM.EMService.onRoleChanged = function(role){ // emedia.mgr.Role
				// TODO 在直播模式下，如果变为主播，请上麦 publish stream
			};
			WebIM.EMService.onStreamAdded = function(member, stream){
				const located = stream.located();
				console.log("来流了", stream.located());
				console.log(member);
				let index;
				if(located){
					let localVideo = me.$refs.rv_local;
					const nickName = member.name;
					let lv = {
						nickName,
						stream: stream,
						localStreamId: stream.id,
						openVideo: true,
						openAudio: true,
					};
					me.$data.rv_local = lv;

					emedia.mgr.onMediaChanaged(localVideo, function(constaints){
						let lv = {
							nickName,
							stream: stream,
							localStreamId: stream.id,
							openVideo: constaints.video,
							openAudio: constaints.audio,
						};
						me.$data.rv_local = lv;
						console.warn(stream.id, "voff:", this.getAttribute("voff"));
						console.warn(stream.id, "aoff:", this.getAttribute("aoff"));
					});
					emedia.mgr.streamBindVideo(stream, localVideo);

				}
				else{
					let rv = me.$data.rv, rvCount = me.$data.rvCount;
					const nickName = member.name,
						streamId = stream.id;
					const contains = (nickName, arr) => {
						for(let [ index, elem ] of arr.entries()){
							if(elem.nickName === nickName){
								return index;
							}
						}
						return false;
					};

					const ifContain = contains(nickName, rv);
					if(ifContain === false){
						
						// 从0～5看哪个位置空着，就往哪里添加
						for(let i = 0; i < 5; i++){
							if(rv[i].nickName == ""){
								index = i;
								if(index || index == 0){
									break;
								}
							}
						}
						rvCount++;
						let video = me.$refs["rv_" + index];

						console.log("别人的video标签", video, index);
						const elem = {
							nickName: nickName,
							streamId: streamId,
							openVideo: true,
							video: rv[index].video
						};
						rv[index] = elem;
						me.$data.rv = rv;
						me.$data.rvCount = rvCount;

						emedia.mgr.onMediaChanaged(video, function(constaints){
							
							const elem = {
								nickName: nickName,
								streamId: streamId,
								openVideo: constaints.video,
								video: rv[index].video
							};
							rv[index] = elem;
							me.$data.rv = rv;
							console.log("别人的video ++++", elem);
							console.log(rv);
							console.warn(streamId, "voff:", this.getAttribute("voff"));
							console.warn(streamId, "aoff:", this.getAttribute("aoff"));
						});
						me.$forceUpdate();
						emedia.mgr.streamBindVideo(stream, video);
						emedia.mgr.subscribe(member, stream, true, true, video);
					}
				}
			};
			WebIM.EMService.onStreamRemoved = function(member, stream){
			};
		},
		closeModal(){
			// clearInterval(this.state.interval)
			WebIM.EMService.exitConference();
			this.hideMultiAVModal();
			this.setConfr("");
			this.$data.rv_local = {
				nickName: "",
				streamId: "",
				openAudio: false,
				openVideo: false,
				video: <div className="default"></div>
			};
			this.$data.rv = new Array(5).fill({
				nickName: "",
				streamId: "",
				openVideo: false,
				video: <div className="default"></div>
			});
			this.$data.rvCount = 0;
			// this.props.resetConfr()
		},
        
		controlRemoteVideo(id){
			// let rv = _.cloneDeep(this.state.rv)
			let rv = this.$data.rv;
			let elem = rv[id];
			if(elem.streamId === ""){
				return;
			}
			let video = this.$refs["rv_" + id];
			if(elem.openVideo){
				emedia.mgr.triggerPauseVideo(video);
			}
			else{
				emedia.mgr.triggerResumeVideo(video);
			}
		},
		controlLocalVideo(){
			let localVideo = this.$refs.rv_local;
			let { stream, localStreamId, openAudio, openVideo } = this.$data.rv_local;
			if(openVideo){
				emedia.mgr.triggerPauseVideo(localVideo);
			}
			else{
				emedia.mgr.triggerResumeVideo(localVideo);
			}
		},
		controlLocalMic(){
			let localVideo = this.$refs.rv_local;
			let { stream, localStreamId, openAudio, openVideo } = this.$data.rv_local;
			if(openAudio){
				emedia.mgr.triggerPauseAudio(localVideo);
			}
			else{
				emedia.mgr.triggerResumeAudio(localVideo);
			}
		},
		invite(){
			this.setAVMemeberModalVisible({ addAVMemberModalVisible: true });
		}

	},

	components: {
		Draggable
	},
};
</script>
<style>
    .multiAVModal{
        width: 100%;
        height: 450px;
        position: relative;
        background: #fff;
		right: 10px;
        top: 0;
        padding: 16px;
        box-shadow: 0 0 10px #ADB9C1;
    }

    .el-row {
    margin-bottom: 20px;
    /* &:last-child {
      margin-bottom: 0;
    } */
  }
  .el-col {
    border-radius: 4px;
  }
  .bg-purple-dark {
    background: #99a9bf;
  }
  .bg-purple {
    background: #d3dce6;
  }
  .bg-purple-light {
    background: #e5e9f2;
  }
  .grid-content {
    border-radius: 4px;
    min-height: 140px;
  }
  .row-bg {
    padding: 5px 0;
    background-color: #f9fafc;
  }
  .video{
    height: 139px;
    width: 100%;
    border-radius: 2px;
  }
  /* .hangup{
         width: 50px;
        height: 30px;
        text-align: center;
        padding: 0;
  } */
  .red{
    color: red;
    float: right;
    margin-right: 12px;
  }
  .videoBox{
      position: relative;
  }
  .tools{
      position: absolute;
      width: 100%;
      bottom: 0;
  }
  .toolsBox{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        justify-content: space-between;
  }
  .title{
      font-size: 24px;
    color: #333;
    line-height: 33px;
    font-weight: 400;
    display: block;
    text-align: start;
    padding: 5px 12px;
    box-sizing: border-box
  }
  .active{
      color: rgba(83, 90, 93, 1);
      font-size: 32px;
  }
    .toolBtn{
        color: rgba(83, 90, 93, 0.6);
        font-size: 32px;
    }
</style>
