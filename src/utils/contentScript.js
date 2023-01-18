/**
 * 获取所有需要打开和爬取的url
 * 返回即将会打开的url
 */
export const getAllLableAccount = () => {
    // start to get all the labels
    const queryString1 = 'a.py-1.px-3.d-block';
    const hrefDom = Array.from(document.querySelectorAll(queryString1)) // dom节点
    const allUrl = hrefDom.map(href => href.href);
    let lableUrl = []
    allUrl.forEach((item) => {
        if (item.includes("accounts")) {
            lableUrl.push(item)
        }
    })
    return lableUrl
}