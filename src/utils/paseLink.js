const paseLink = (msg) => {
    let isLink = false
    var reg =
        /(https?\:\/\/|www\.)([a-zA-Z0-9-]+(\.[a-zA-Z0-9]+)+)(\:[0-9]{2,4})?\/?((\.[:_0-9a-zA-Z-]+)|[:_0-9a-zA-Z-]*\/?)*\??[:_#@*&%0-9a-zA-Z-/=]*/gm

    msg = msg.replace(reg, function (v) {
        const prefix = /^https?/gm.test(v)
        isLink = prefix
        return (
            "<a href='" +
            (prefix ? v : '//' + v) +
            "' target='_blank'>" +
            v +
            '</a>'
        )
    })

    return { isLink, msg }
}

export default paseLink
