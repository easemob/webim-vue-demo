const paseLink = (msg) => {
    var reg =
        /(https?\:\/\/|www\.)([a-zA-Z0-9-]+(\.[a-zA-Z0-9]+)+)(\:[0-9]{2,4})?\/?((\.[:_0-9a-zA-Z-]+)|[:_0-9a-zA-Z-]*\/?)*\??[:_#@*&%0-9a-zA-Z-/=]*/gm

    msg = msg.replace(reg, function (v) {
        var prefix = /^https?/gm.test(v)

        return (
            "<a href='" +
            (prefix ? v : '//' + v) +
            "' target='_blank'>" +
            v +
            '</a>'
        )
    })

    return msg
}

export default paseLink
