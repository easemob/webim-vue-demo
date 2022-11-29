/* 会话列表排序 */
import _ from 'lodash'

export default function (conversationList) {
    const newConversationObj = {}
    const toBeUpdateData = _.values(conversationList)
    const sortedArr = _.sortBy(toBeUpdateData, function (o) {
        return -o.latestSendTime
    })

    sortedArr.forEach((item) => {
        const key = item.conversationKey

        return (newConversationObj[key] = item)
    })
    return newConversationObj
}
