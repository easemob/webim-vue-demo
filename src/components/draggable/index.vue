<template>
	<div id="app1">
		<div :id="id || 'drag'" class="drag">
			<slot id="child">empty</slot>
		</div>
	</div>
</template>

<script>

import draggable from 'vuedraggable';
export default{
	data(){
		return {
			showDrag: false
		};
	},
	props: [
		'id'
	],
	methods: {
		dragVisibleToggle(){
			this.$data.showDrag = !this.$data.showDrag;
			if(!this.$data.showDrag){
				let parent = document.getElementById(this.id);
				let child = document.getElementById('child');
				parent.removeChild(child);
			}
		},
	},
	mounted(){
		var _isPc = isPC();
		var startEvent = _isPc ? 'mousedown' : 'touchstart';
		var moveEvent = _isPc ? 'mousemove' : 'touchmove';
		var upEvent = _isPc ? 'mouseup' : 'touchend';
		var id = this.id || 'drag';
		var v = 0;
		var el = document.getElementById(id);

		// 为了防止火狐浏览器拖拽的时候以新标签打开，此代码真实有效
		document.body.ondrop = function(event){
			event.preventDefault();
			event.stopPropagation();
		};
		function isPC(){// 网上随便找了一段判断是否是移动端的代码
			var userAgentInfo = navigator.userAgent;
			var Agents = new Array('Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod');
			var flag = true;
			for(v; v < Agents.length; v++){
				if(userAgentInfo.indexOf(Agents[v]) > 0){ flag = false; break; }
			}
			return flag;
		}
		
		el.addEventListener(startEvent, startFun, true);

		function startFun(e){
			let divx = 0
			let divy = 0
			// 获取鼠标点击处分别与div左边和上边的距离：鼠标位置-div位置
			if(!_isPc){
				if(e.targetTouches && e.targetTouches.length == 1){
					let touch = e.targetTouches[0];  // 把元素放在手指所在的位置
					divx = touch.pageX - document.getElementById(id).offsetLeft;
					divy = touch.pageY - document.getElementById(id).offsetTop;
				}
			}
			else{
				divx = e.clientX - document.getElementById(id).offsetLeft;
				divy = e.clientY - document.getElementById(id).offsetTop;
			}
			// 包含在onmousedown里，表示点击后才移动，为防止鼠标移出div，使用document.onmousemove
			document.addEventListener(moveEvent, moveFun, true);
			
			function moveFun(e){
				// 获取移动后div的位置：鼠标位置-divx/divy
				if(e.targetTouches && e.targetTouches.length == 1){
					let touch = e.targetTouches[0];  // 把元素放在手指所在的位置
					let l = touch.pageX - divx;
					let t = touch.pageY - divy;
					document.getElementById(id).style.left = l + 'px';
					document.getElementById(id).style.top = t + 'px';
				}
				else{
					let l = e.clientX - divx;
					let t = e.clientY - divy;
					document.getElementById(id).style.left = l + 'px';
					document.getElementById(id).style.top = t + 'px';
				}
			}
			document.addEventListener(upEvent, upFun, true);

			function upFun(e){
				document.removeEventListener(moveEvent, moveFun, true);
				document.removeEventListener(upEvent, upFun, true);
				// document.onmousemove = null;
				document.onmouseup = null;
			}
		}
	}
};

</script>

<style>
.drag{
	position: absolute;
	left: 5%;
	top: 10%;
	margin: auto;
	border-radius: 2px;
	/* background: #f3f3f3; */
	z-index: 999;
}
</style>
