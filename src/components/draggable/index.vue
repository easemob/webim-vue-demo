<template>
    <div id="app1">
        <div id="drag" v-drag>
        <!-- <div class="toolBarTitle move">移动工具栏</div> -->
        <slot>empty</slot>
        </div>
    </div>
</template>

<script>
import draggable from 'vuedraggable'
export default{
        data(){
            return{
                showDrag: false
            }
        },
        methods:{
            getdata (evt) {
                console.log(evt.draggedContext.element.text)
            },
            dragVisibleToggle() {
                this.$data.showDrag = !this.$data.showDrag;
            },
        },
        mounted () {
	        //为了防止火狐浏览器拖拽的时候以新标签打开，此代码真实有效
            document.body.ondrop = function (event) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        directives:{
            drag(el){
                function IsPC(){// 网上随便找了一段判断是否是移动端的代码
                    var userAgentInfo = navigator.userAgent;  
                    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");  
                    var flag = true;  
                    for (var v = 0; v < Agents.length; v++) {  
                        if (userAgentInfo.indexOf(Agents[v]) > 0) { flag = false; break; }  
                    }  
                    return flag;
                } 
                var _isPc = IsPC();
                console.log(el)
                console.log(_isPc)
                var startEvent = _isPc ? 'mousedown' : 'touchstart';
                var moveEvent = _isPc ? 'mousemove' : 'touchmove';
                var upEvent = _isPc ? 'mouseup' : 'touchend';

                el.addEventListener(startEvent, startFun, true)

                function startFun(e){
                    //获取鼠标点击处分别与div左边和上边的距离：鼠标位置-div位置
                    var divx = e.clientX - document.getElementById('drag').offsetLeft;
                    var divy = e.clientY - document.getElementById('drag').offsetTop;
                    //包含在onmousedown里，表示点击后才移动，为防止鼠标移出div，使用document.onmousemove
                    document.addEventListener(moveEvent, moveFun, true)
                    function moveFun(e){
                        //获取移动后div的位置：鼠标位置-divx/divy
                        var l = e.clientX - divx;
                        var t = e.clientY - divy;
                        document.getElementById('drag').style.left=l+'px';
                        document.getElementById('drag').style.top=t+'px';
                    }
                    document.addEventListener(upEvent, upFun, true)

                    function upFun(e){
                        document.removeEventListener(moveEvent, moveFun, true)
                         document.removeEventListener(upEvent, upFun, true)
                       // document.onmousemove = null;
                        document.onmouseup = null;
                    }
                }
            }
        }
    }

</script>

<style>
#drag{
    position: absolute;
    left: 5%;
    top: 10%;
    margin: auto;
    border-radius: 2px;
    background: #f3f3f3;
    z-index: 999;
}
</style>