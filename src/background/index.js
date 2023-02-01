/*global chrome*/
let addressPool = [] // 防地址重复的数组记录(包含所有获取过的地址)
let labelsData = [] // 最终结果
let chainInfo = {}

// const types = ['1', '0', '3-0', '2'];
let types = ['1'];
/**
 * 每个项⽬有3个可能的类型
 * 分别对应 
 * 1=Main, 3-0=Others, 2=Legacy (例如Augur)
 * celer-network 的Others为0 https://etherscan.io/accounts/label/celer-network?subcatid=0&size=25&start=0&col=1&order=asc
 * fortube 的Others为3
 */
let typeMax = types.length; //类型标签遍历的最⼤值 
let index = 0; // 当前打开的⻚⾯索引，当到达max时完成 
let typeIndex = 0 // 每个打开的url都有四个可能的标签

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

            console.log("检验数据是否初始化", addressPool, labelsData);

            scan(openUrls)
        } else if (request.type === "parseLabelsMain") {
            if (request.tabsList.length) {
                types = request.tabsList
                typeMax = types.length
            } else {
                types = ['1'];
            }
            saveAddress()
        } else if (request.type === "parseLabelsOthers") {
            saveAddress()
        }

        function saveAddress() {
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



/**
 * 开始打开url
 * 参数:需要打开的url
 */
const scan = (urls) => {
    const type = types[typeIndex]; // 记录每次打开的 type 用于作为本属性所有标签便打开结束的临界点

    // let currentLabelGroup = '';  // 此时所打开地址的属性的名称
    // currentLabelGroup = urls[index].lastIndexOf("/");
    // currentLabelGroup = urls[index].slice(currentLabelGroup + 1)
    // console.log("currentLabelGroup此时打开页面的标签", currentLabelGroup);

    // console.log("scan执行");
    let url = `${urls[index]}?subcatid=${type}&size=2000&start=0&col=1&order=asc`
    chrome.tabs.create({ url: url })
    console.log("新打开的tab type为:", type, "打开的url为:", url);
    typeIndex++; // 为下一次打开新的作准备
    let time = 3000 + Math.round(Math.random() * 1000)
    setTimeout(function () {
        closeUrl(urls)
    }, time)

}

// 后续可以思考的优化:有些标签中是没有4个types的,是不是可以先判断出来再根据现有的去决定当前的标签打开几个页面,可以减少不必要的打开次数

const closeUrl = (urls) => {
    const max = urls.length;// 整个标签地址的最⼤值 

    chrome.tabs.query({ url: "https://*/accounts/label/*" }, function (tabs) {
        chrome.tabs.remove(tabs[0].id, function () { });
    })
    console.log("typeIndex and typeMax", typeIndex, typeMax);
    // ⼀个项⽬⻚⾯的⼏个type⻚⾯循环 (这里如果是本页面没有的type 会默认跳到默认打开的第一个页面 获取到的地址会在addressPool中判断重复则不会添加)
    if (typeIndex >= typeMax) {
        // 一个属性下几个tab标签的循环结束 开始打开新的属性
        typeIndex = 0;
        types = ["1"]
        typeMax = types.length
        index++;
        console.log("此时标签index:", index, "所有地址最大index:", max - 1);
        if (index >= max) {
            // if (index >= 1) {
            // 整个列表的⻚⾯循环结束 现在V3版本中无法获取到Windows对象 所以我发送到popup页面中执行下载操作
            console.log("Over,发送数据到popup");


            const filename = `${chainInfo.chainName}-${chainInfo.time}.json`
            downloadFile(labelsData, filename)

            // 还需要需要注意:当一个链上的数据下载完毕后需要把 labelsData 重新变为空数组 否则会影响新的链的数据获取
            // 最好后续再检查一下如果被中断会不会影响下一次的获取:强制刷新之后数据会重新初始化的
            // 下载后所有数据初始化：避免影响下一次下载
            types = ['1'];
            index = 0;
            typeIndex = 0
            addressPool = []
            labelsData = []
            chainInfo = {}
        } else {
            scan(urls);
        }
    } else {
        scan(urls)
    }
}

// 文件下载方法
function downloadFile(content, filename) {
    // const blob = new Blob([content], { type: "text/json;charset=UTF-8" });
    // var url = window.URL.createObjectURL(blob);
    const url = 'data:application/json;base64,' + btoa(JSON.stringify(content))
    chrome.downloads.download({
        url: url,
        filename: filename,
    })
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
