/*global chrome*/

export default function excuteTokenContentScript() {
    const locationHref = window.location.href

    if (locationHref.indexOf('/tokens/label') > -1) {
        const website = /https?:\/\/(.*?)\./.exec(locationHref)[1]

        let addressQuery = 'tbody tr td:nth-child(2)' // bscscan poygonscan
        let labelQuery = 'tbody tr td:nth-child(3)' // bscscan poygonscan
        let groupQuery = 'h1.h4.font-weight-normal.mb-0 span.small' // bscscan poygonscan
        if (website === "etherscan") {
            // addressQuery = 'tbody tr td div.d-flex.align-items-center.gap-1 a.js-clipboard.link-secondary'  // etherscan 
            groupQuery = 'span.text-muted.text-break'
        }
        const addresses = Array.from(document.querySelectorAll(addressQuery));
        console.log(addresses, "addresses");
        const labels = Array.from(document.querySelectorAll(labelQuery))
        let addressResult = [];
        // const group = locationHref.slice(locationHref.lastIndexOf("/") + 1, locationHref.lastIndexOf("?"))
        const group = document.querySelector(groupQuery).textContent.replace(/\n/g, '')
        let chain_id = 0
        switch (website) {
            case "etherscan":
                chain_id = "1"
                break;
            case "bscscan":
                chain_id = "56"
                break;
            case "polygonscan":
                chain_id = "137"
                break;
            default:
                break;
        }

        for (let i = 0; i < addresses.length; i++) {
            // 只选出 Name Tag下面有内容的
            if (!!labels[i]) {
                // console.log("获取地址:", addresses[i], labels[i], url.href);
                let newAddress = {
                    address: addresses[i].textContent,
                    category: "Token",
                    chain_id: chain_id,
                    label: labels[i].textContent.trim(),
                    group,
                }
                if (website === "etherscan") {
                    newAddress = {
                        ...newAddress,
                        address: addresses[i].firstElementChild.lastElementChild.dataset.clipboardText,// etherscan
                        label: labels[i].textContent.replace(/\s+/g, ' ').trim(),
                    }
                }
                console.log("newAddress", newAddress);
                try {
                    btoa(JSON.stringify(newAddress))
                    addressResult.push(newAddress)
                } catch {
                    console.log("发现含有 Latin1 以外的地址 丢弃:", newAddress);
                }
            }
        }
        console.log(addressResult);

        //解析完毕，发送到background⾥去 
        if (locationHref.indexOf('?subcatid=0') > -1) {
            // 如果是这个标签第一个打开 => 获取到 tabs
            let tabsQuery = "ul.nav.nav-custom.nav-borderless.nav_tabs li a" // bscscan poygonscan (暂时还没有碰到有分类的)
            if (website === "etherscan") {
                tabsQuery = "ul.nav.nav-pills li a" // etherscan
                // https://etherscan.io/tokens/label/cream-finance?subcatid=0&size=50&start=0&col=3&order=desc
            }
            const tabs = Array.from(document.querySelectorAll(tabsQuery))
            const tabsList = tabs.map(a => a.getAttribute("data-sub-category-id"))

            console.log(tabsList);

            chrome.runtime.sendMessage({
                type: "parseLabelsMain",
                addressResult,
                tabsList,
                href: locationHref.split("?")[0]
            }, function (response) { });
        } else {
            chrome.runtime.sendMessage({
                type: "parseLabelsOthers",
                addressResult,
                href: locationHref.split("?")[0]
            }, function (response) { });
        }
    }
}

// 发现的疑惑：所有的在tokens中拿到的地址，大部分（还没确定是不是所有）都可以在accounts中有同样的记录，这意味着会有重复的记录，而且一个会被标记为Token，一个会被标记为Contract
// 不是全部都重合，但是会有大部分重合