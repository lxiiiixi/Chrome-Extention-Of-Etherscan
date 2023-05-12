/*global chrome*/
import { createRoot } from "react-dom/client"
import { getAllLabel } from "../utils/getAllLabel"
import excuteAccountContentScript from "../utils/accountsContentScript";
import excuteTokenContentScript from "../utils/tokensContentScript";

console.log("content script 执行");

const locationHref = window.location.href

// popup => content 
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === "getUrls") {
            const chainInfo = request.chainInfo
            const openUrls = getAllLabel(chainInfo.chainName, chainInfo.queryType)
            // 将需要打开的url发送给background
            chrome.runtime.sendMessage({ type: "startScan", openUrls, chainInfo });
        }
    }
);

excuteAccountContentScript()

excuteTokenContentScript()


// content页面的监听需要做两件事 一个是对所有标签的获取 一个是进入某一个打开的account页面之后对所有地址的获取
const Content = () => (<div></div>)

// 创建id为CRX-container的div
const app = document.createElement('div')
app.id = 'CRX-container'
// 将刚创建的div插入body最后
document.body.appendChild(app)
// 将ReactDOM插入刚创建的div
const container = createRoot(app)
container.render(<Content />)