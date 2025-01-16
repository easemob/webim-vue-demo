const waterMark = ({
  container,
  waterToggle = 'true',
  width = '200px',
  height = '80px',
  textAlign = 'center',
  textBaseline = 'middle',
  font = '12px Microsoft Yahei',
  fillStyle = 'rgba(184, 184, 184, 0.3)',
  rotate = '-10',
  zIndex = 0,
} = {}) => {
  if (waterToggle == 'true') {
    const content = `${
      '【环信IM】' +
        JSON.parse(window.localStorage.getItem('EASEIM_loginUser')).user ||
      '环信即时通讯云'
    }`;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    const ctx = canvas.getContext('2d');
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;
    ctx.font = font;
    ctx.fontColor = 'red';
    ctx.fillStyle = fillStyle;
    ctx.rotate((Math.PI / 180) * rotate);
    ctx.fillText(content, parseFloat(width) / 2, parseFloat(height) / 2);
    const base64Url = canvas.toDataURL();
    const watermarkDiv = document.createElement('div');
    const styleStr = `
					position:absolute;
					top:0;
					left:0;
					width:100%;
					height:100%;
					z-index:${zIndex};
					pointer-events:none;
					background-repeat:repeat;
					background-image:url('${base64Url}')
				`;
    const __wm = container.querySelector('.__wm');
    watermarkDiv.setAttribute('style', styleStr);
    // 防止多次添加
    if ((__wm && __wm.getAttribute('style') !== styleStr) || !__wm) {
      container.style.position = 'relative';
      container.insertBefore(watermarkDiv, container.firstChild);
      watermarkDiv.classList.add('__wm');
    }

    const MutationObserver =
      window.MutationObserver || window.WebKitMutationObserver;
    // 检查浏览器是否支持这个API
    if (MutationObserver) {
      let mo = new MutationObserver(function () {
        // 只在__wm元素变动才重新调用 __canvasWM
        if ((__wm && __wm.getAttribute('style') !== styleStr) || !__wm) {
          // 避免一直触发
          mo.disconnect();
          mo = null;
          waterMark({ container });
        }
      });

      mo.observe(container, {
        attributes: true, // 观察目标节点的属性节点
        subtree: true, // 观察目标节点的所有后代节点
        childList: true, // 观察目标节点的子节点
      });
    }
  }
};

export default waterMark;
