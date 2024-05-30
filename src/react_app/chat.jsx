import { UIKitProvider, Chat, ConversationList } from "easemob-chat-uikit";
import 'easemob-chat-uikit/style.css'
const appKey = "appkey";
const userId = "userId";
const password = "password";

const EaseChat = (props) => {
  const { theme } = props;
  return (
    <UIKitProvider
      initConfig={{
        appKey,
        userId,
        password,
        useUserInfo: true
      }}
      theme={{
        mode: theme
      }}
    >
      <div className="chat-wrap">
        <div className="conversation-list">
          <ConversationList></ConversationList>
        </div>
        <div className="chat">
          <Chat></Chat>
        </div>
      </div>
    </UIKitProvider>
  );
};

export default EaseChat;
