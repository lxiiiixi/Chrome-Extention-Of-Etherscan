/*global chrome*/
let addressPool = [] // 防地址重复的数组记录(包含所有获取过的地址)
let labelsData = [] // 最终结果
let chainInfo = {}

// 侦听从⻚⾯发来的消息和数据
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
        // bug:这里收到两次 所以以下内容都执行了两次

        // 接受到的请求来自content script
        if (request.type === "startScan") {
            const openUrls = request.openUrls
            chainInfo = request.chainInfo
            console.log("background 收到来自content的请求", openUrls);
            scan(openUrls)
        } else if (request.type === "parseLabels") {
            // 当打开诸如https://etherscan.io/accounts/label/binance⻚⾯时
            // content.js抓到了具体的标签数据，通过 消息传过来
            let currentLabelData = []
            let confirmSave = true
            request.addressResult = request.addressResult.map(item => {
                // item.group = currentLabelGroup;  // 本次打开的label名
                return item;
            })
            for (let i = 0; i < request.addressResult.length; i++) {
                let r = request.addressResult[i];
                // console.log("检测addressPool中是否有这个地址", addressPool, r.address, addressPool.indexOf(r.address));
                if (addressPool.indexOf(r.address) === -1) { // 如果addressPool中没有这个地址才会更新到结果中
                    // 为什么这么addressPool中有的地址还是会执行到这一步
                    console.log("labelsData+", r);
                    currentLabelData.push(r)
                }
            }
            if (confirmSave) {
                labelsData = [...labelsData, ...currentLabelData]
            }
            // 记录已经抓到的地址放入addressPool中用于下次增加地址之前的判断防重复
            let addresses = request.addressResult.map(item => item.address);
            addressPool = addressPool.concat(addresses);
            // console.log("addressPool", addressPool);
            console.log("labelsData", labelsData)
            sendResponse({ currentLabelData: currentLabelData });
            return true;
        }
    }
);


const types = ['1', '0', '3-0', '2']; //每个项⽬有3个可能的类型，分别对应Main, Others,Others, Legacy (例如Augur)
const typeMax = types.length; //类型标签遍历的最⼤值 
let index = 0; // 当前打开的⻚⾯索引，当到达max时完成 
let typeIndex = 0 // 每个打开的url都有四个可能的标签
let max = 0
let type = "" // 记录每次打开的 type 用于作为本属性所有标签便打开结束的临界点

/**
 * 开始打开url
 * 参数:需要打开的url
 */
const scan = (urls) => {
    max = urls.length;// 整个标签地址的最⼤值 
    type = types[typeIndex];

    // let currentLabelGroup = '';  // 此时所打开地址的属性的名称
    // currentLabelGroup = urls[index].lastIndexOf("/");
    // currentLabelGroup = urls[index].slice(currentLabelGroup + 1)
    // console.log("currentLabelGroup此时打开页面的标签", currentLabelGroup);

    console.log("scan执行");
    let url = `${urls[index]}?subcatid=${type}&size=2000&start=0&col=1&order=asc`
    chrome.tabs.create({ url: url })
    console.log("新打开的tab type为:", type, "打开的url为:", url);
    typeIndex++; // 为下一次打开新的作准备
    let time = 3000 + Math.round(Math.random() * 1000)
    setTimeout(function () {
        closeUrl(max, urls)
    }, time)

}

// 后续可以思考的优化:有些标签中是没有4个types的,是不是可以先判断出来再根据现有的去决定当前的标签打开几个页面,可以减少不必要的打开次数

const closeUrl = (max, urls) => {
    chrome.tabs.query({ url: "https://*/accounts/label/*" }, function (tabs) {
        chrome.tabs.remove(tabs[0].id, function () { });
    })
    console.log("typeIndex and typeMax", typeIndex, typeMax);
    // ⼀个项⽬⻚⾯的⼏个type⻚⾯循环 (这里如果是本页面没有的type 会默认跳到默认打开的第一个页面 获取到的地址会在addressPool中判断重复则不会添加)
    if (typeIndex >= typeMax) {
        // 一个属性下几个tab标签的循环结束
        typeIndex = 0;
        index++;
        console.log("此时标签index:", index, "所有地址最大index:", max - 1);
        // if (index >= max) {
        if (index >= 1) {
            // 整个列表的⻚⾯循环结束 现在V3版本中无法获取到Windows对象 所以我发送到popup页面中执行下载操作
            index = 0;
            console.log("Over,发送数据到popup");
            console.log(window);
            var backgroundPage = chrome.extension.getBackgroundPage();
            backgroundPage.alert("Over")

            // const filename = `${chainInfo.chainName}-${chainInfo.time}.json`
            // chrome.runtime.sendMessage({ type: "finish", labelsData, filename });

            // 当前的问题是现在background无法获取windows对象 发送消息给content/popup页面也无法收到消息

            // 还需要需要注意:当一个链上的数据下载完毕后需要把 labelsData 重新变为空数组 否则会影响新的链的数据获取
            // 最好后续再检查一下如果被中断会不会影响下一次的获取
        } else {
            scan(urls);
        }
    } else {
        scan(urls)
    }
}




// manifest.json的Permissions配置需添加 declarativeContent 权限
chrome.runtime.onInstalled.addListener(function () {
    // 默认先禁止Page Action。如果不加这一句，则无法生效下面的规则
    chrome.action.disable()
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        // 设置规则
        let rule = {
            // 运行插件运行的页面URL规则
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {
                        // 适配所有域名以“www.”开头的网页
                        // hostPrefix: 'www.'
                        // 适配所有域名以“.baidu.com”结尾的网页
                        // hostSuffix: '.baidu.com',
                        // 适配域名为“www.baidu.com”的网页
                        // hostEquals: 'www.baidu.com',
                        // 适配https协议的网页
                        schemes: ['https'],
                    },
                }),
            ],
            actions: [
                // ShowPageAction已被废弃，改用ShowAction。为了兼顾旧版，做了兼容适配
                chrome.declarativeContent.ShowAction
                    ? new chrome.declarativeContent.ShowAction()
                    : new chrome.declarativeContent.ShowPageAction(),
            ],
        }
        // 整合所有规则
        const rules = [rule]
        // 执行规则
        chrome.declarativeContent.onPageChanged.addRules(rules)
    })
})
