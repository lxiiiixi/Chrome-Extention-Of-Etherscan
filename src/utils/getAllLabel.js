/**
 * 获取所有需要打开和爬取的url
 * 返回即将会打开的url
 */
export const getAllLabel = (chainName, queryType) => {
    // start to get all the labels
    let queryString = 'a.py-1.px-3.d-block'; // bscscan poygonscan
    if (chainName === "Etherscan") {
        queryString = "a.dropdown-item.d-flex.align-items-center.gap-2" // etherscan
    }
    const hrefDom = Array.from(document.querySelectorAll(queryString)) // dom节点
    const allUrl = hrefDom.map(href => href.href);
    let labelUrl = []
    allUrl.forEach((item) => {
        if (item.includes(queryType)) {
            labelUrl.push(item)
        }
    })
    return labelUrl
}