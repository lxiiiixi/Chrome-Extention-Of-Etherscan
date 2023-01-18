/*global chrome*/
import { createRoot } from "react-dom/client"
import { getAllLableAccount } from "../utils/contentScript"
import "./content.scss"

console.log("content script 执行");

let chainInfo = {}  // 当时所获取网站的信息
const locationHref = window.location.href

// popup => content 
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === "getUrls") {
            chainInfo = request.chainInfo
            const openUrls = getAllLableAccount()
            // 将需要打开的url发送给background
            chrome.runtime.sendMessage({ type: "startScan", openUrls, chainInfo });
        }
    }
);

if (locationHref.indexOf('/accounts/label') > -1) {
    let addressQuery = 'tbody td a'
    // let labelQuery = 'tbody td.sorting_1'
    let labelQuery = 'tbody td:nth-child(2)'
    let urlQuery = 'div.card.mb-3 div.card-body span a'
    let addresses = Array.from(document.querySelectorAll(addressQuery));
    let labels = Array.from(document.querySelectorAll(labelQuery))
    let url = document.querySelector(urlQuery) || {};
    let addressResult = [];
    const lableName = locationHref.slice(locationHref.lastIndexOf("/") + 1, locationHref.lastIndexOf("?"))
    for (let i = 0; i < addresses.length; i++) {
        // 只选出 Name Tag下面有内容的
        if (labels[i].textContent) {
            console.log("获取地址:", addresses[i], labels[i], url.href);
            addressResult.push({
                address: addresses[i].textContent,
                nameTag: labels[i].textContent,
                url: url.href ? url.href : "",
                lableName
            })
        }
    }
    console.log(addressResult);
    //解析完毕，发送到background⾥去 
    chrome.runtime.sendMessage({ type: "parseLabels", lableName, addressResult }, function (response) {
        // console.log("本页面获取到的地址数据:", response.currentLabelData);
    });
}



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