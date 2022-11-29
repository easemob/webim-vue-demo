export default function (arr1, arr2) {
    return arr1.concat(arr2).filter((v, i, arr) => {
        return arr.indexOf(v) === arr.lastIndexOf(v)
    })
}
