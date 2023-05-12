/*global chrome*/

export default function excuteTokenContentScript() {
    const locationHref = window.location.href

    if (locationHref.indexOf('/accounts/label') > -1) {
        const website = /https?:\/\/(.*?)\./.exec(locationHref)[1]

        let addressQuery = 'tbody tr td:nth-child(1)' // bscscan poygonscan
        let labelQuery = 'tbody tr td:nth-child(2)' // bscscan poygonscan
        if (website === "etherscan") {
            // addressQuery = 'tbody td a.js-clipboard.link-secondary'  // etherscan 这里获取的是地址旁边的复制按钮
            addressQuery = 'tbody tr td.d-flex.align-items-center'  // etherscan 
        }
        const addresses = Array.from(document.querySelectorAll(addressQuery));
        // console.log(addresses, "addresses");
        const labels = Array.from(document.querySelectorAll(labelQuery))
        let addressResult = [];
        const group = locationHref.slice(locationHref.lastIndexOf("/") + 1, locationHref.lastIndexOf("?"))
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
            if (!!labels[i]?.textContent) {
                // console.log("获取地址:", addresses[i], labels[i], url.href);
                let newAddress = {
                    address: addresses[i].firstElementChild?.textContent,
                    category: addresses[i].firstElementChild?.href ? "Address" : "Contract",
                    chain_id: chain_id,
                    label: labels[i].textContent,
                    group,
                }
                if (website === "etherscan") {
                    newAddress = {
                        ...newAddress,
                        address: (addresses[i].firstElementChild?.href) ? addresses[i].lastElementChild.dataset.clipboardText : addresses[i].firstElementChild.lastElementChild.dataset.clipboardText,// etherscan
                        // category: addresses[i].firstElementChild?.href ? "Address" : "Contract",
                    }
                }
                // console.log("newAddress", newAddress);
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
        if (locationHref.indexOf('?subcatid=1') > -1) {
            // 如果是这个标签第一个打开 => 获取到 tabs
            let tabsQuery = "ul.nav.nav-custom.nav-borderless.nav_tabs li a" // bscscan poygonscan
            if (website === "etherscan") {
                tabsQuery = "ul.nav.nav-pills li a" // etherscan
            }
            const tabs = Array.from(document.querySelectorAll(tabsQuery))
            const tabsList = tabs.map(a => a.getAttribute("val"))

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