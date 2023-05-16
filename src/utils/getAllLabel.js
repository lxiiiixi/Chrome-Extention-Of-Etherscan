const needlessUrl = [
    "https://etherscan.io/accounts/label/beacon-depositor", // 数据量太大
    "https://etherscan.io/accounts/label/liqui.io", // 异常跳转
    "https://etherscan.io/accounts/label/uniswap",  // 数据量太大
    "https://etherscan.io/tokens/label/uniswap" // 不需要
]
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
    return filterUrl(labelUrl, needlessUrl)
}

const filterUrl = (allUrl, needlessUrl) => {
    return allUrl.filter((item) => !needlessUrl.includes(item))
}