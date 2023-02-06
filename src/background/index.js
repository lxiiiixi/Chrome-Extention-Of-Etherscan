/*global chrome*/
let addressPool = [] // 防地址重复的数组记录(包含所有获取过的地址)
let labelsData = [] // 最终结果
let chainInfo = {}
let openUrls = []
let openedUrl = [] // 被打开过的url
let times = 0 // 记录完成后重新获取的次数（防止有异常地址时无限循环无法下载）

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
let closeTime = 3000

// 侦听从⻚⾯发来的消息和数据
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
        // bug:这里收到两次 所以以下内容都执行了两次

        // 接受到的请求来自content script 只会在点击按钮后执行一次
        if (request.type === "startScan") {
            openUrls = request.openUrls
            chainInfo = request.chainInfo
            console.log("background 收到来自content的请求", openUrls);
            console.log("检验数据是否初始化", addressPool, labelsData);
            scan()
        } else if (request.type === "parseLabelsMain") {
            // 还有一个问题：如果type为1时的没有被打开，数据没有请求过来，那么整个属性下面的所有tab下的数据都不会被拿到
            if (request.tabsList.length) {
                types = request.tabsList
                typeMax = types.length
            } else {
                types = ['1'];
            }
            saveAddress()
            openedUrl.push(request.href)
        } else if (request.type === "parseLabelsOthers") {
            saveAddress()
            openedUrl.push(request.href)
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
                    // console.log("labelsData+", r);
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
 */
const scan = () => {
    const type = types[typeIndex]; // 记录每次打开的 type 用于作为本属性所有标签便打开结束的临界点
    let time = closeTime + Math.round(Math.random() * 1000)


    // let currentLabelGroup = '';  // 此时所打开地址的属性的名称
    // currentLabelGroup = urls[index].lastIndexOf("/");
    // currentLabelGroup = urls[index].slice(currentLabelGroup + 1)
    // console.log("currentLabelGroup此时打开页面的标签", currentLabelGroup);

    // console.log("scan执行");
    let url = `${openUrls[index]}?subcatid=${type}&size=2000&start=0&col=1&order=asc`
    chrome.tabs.create({ url: url })
    console.log("新打开的tab type为:", type, "打开的url为:", url);

    typeIndex++; // 为下一次打开新的作准备
    if (index !== 0 && !(index % 50)) closeTime += 1000
    setTimeout(function () {
        closeUrl()
    }, time)
}

// 后续可以思考的优化:有些标签中是没有4个types的,是不是可以先判断出来再根据现有的去决定当前的标签打开几个页面,可以减少不必要的打开次数

const closeUrl = () => {

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
        // 打开后index指向下一个url
        index++;
        console.log("下一个将打开标签的index:", index);


        if (index >= openUrls.length) {
            // if (index >= 10) {

            // 到这里之后原来的全都被打开完成了，但是还要筛选出没有成功获取到数据的地址，将地址放到urls中继续获取
            // 从 openUrls 中筛选出 openedUrl 中没有的
            let notOpendUrls = []
            openUrls.forEach((item) => {
                if (!openedUrl.includes(item)) {
                    notOpendUrls.push(item)
                }
            })
            console.log("已经获取到的url地址：", openedUrl, "未获取成功的url地址：", notOpendUrls);
            if (times >= 10) {
                notOpendUrls = []
                console.log("times:", times, "直接下载");
            }

            if (!notOpendUrls.length) {
                const filename = `${chainInfo.chainName}-${chainInfo.time}.json`
                downloadFile(labelsData, filename)

                // 还需要需要注意:当一个链上的数据下载完毕后需要把 labelsData 重新变为空数组 否则会影响新的链的数据获取
                // 最好后续再检查一下如果被中断会不会影响下一次的获取:强制刷新之后数据会重新初始化的
                // 下载后所有数据初始化：避免影响下一次下载
                types = ['1'];
                typeIndex = 0
                addressPool = []
                labelsData = []
                index = 0;
                chainInfo = {}
                closeTime = 3000
            } else {
                // 如果还有数据没有获取
                console.log("再次次获取遗漏的数据", notOpendUrls);
                times++

                types = ['1'];
                typeIndex = 0
                openUrls = notOpendUrls
                index = 0;
                openedUrl = []
                closeTime += 5000 // 对特殊的网站延长等待时间
                scan()
            }
        } else {
            scan();
        }
    } else {
        scan()
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
