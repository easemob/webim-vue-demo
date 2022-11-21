function uuid() {
    var temp_url = URL.createObjectURL(new Blob())
    var uuid = temp_url.toString() // blob:https://xxx.com/b250d159-e1b6-4a87-9002-885d90033be3
    URL.revokeObjectURL(temp_url)
    return uuid.substr(uuid.lastIndexOf('/') + 1)
}
export default uuid