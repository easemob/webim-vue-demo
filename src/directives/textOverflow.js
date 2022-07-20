import { nextTick } from 'vue';
function textOverflow(el) {
  nextTick(() => {
    // console.log('指令的方式11111111：' + el.innerHTML);
    let text = el.innerHTML;
    // 遍历元素的innerHTML内容，当元素的offsetHeight小于scrollHeight（超出元素的高度溢出换行）时，
    // 设置溢出隐藏（overflow = "hidden"）
    // 将末尾的三个文字用...取代，同时跳出for循环
    if (!text || !text.length) return;
    // console.log("指令的方式22222：" + el.innerHTML);
    for (let i = 0; i <= text.length; i++) {
      el.innerHTML = text.substr(0, i);
      // console.log("指令的方式3333：" + el.offsetHeight, el.scrollHeight);
      if (el.offsetHeight < el.scrollHeight) {
        el.style.overflow = 'hidden';
        // 截取当前字符串0-倒数第三的区间位置的字符并加上"..."，然后赋值给元素的innerHTML
        el.innerHTML = text.substr(0, i - 3) + '...';
        // console.log('指令的方式4444：' + el.innerHTML);
        break;
      }
    }
  });
}

export default textOverflow;
