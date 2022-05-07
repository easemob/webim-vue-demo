//引入环信SDK
import Easemob_SDK from 'easemob-websdk';
//环信appKey
const appKey = 'easemob-demo#easeim';
//存放实例化后所有的方法
let Ease = {};
Ease = Easemob_SDK;
//实例化环信SDK
Ease.conn = new Easemob_SDK.connection({
  appKey,
});
// console.log('Ease', Ease);
export default Ease;
