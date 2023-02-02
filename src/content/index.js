/*global chrome*/
import { createRoot } from "react-dom/client"
import { getAllLabelAccount } from "../utils/contentScript"
import "./content.scss"

console.log("content script 执行");

let chainInfo = {}  // 当时所获取网站的信息
const locationHref = window.location.href

// popup => content 
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === "getUrls") {
            chainInfo = request.chainInfo
            const openUrls = getAllLabelAccount()
            // 将需要打开的url发送给background
            chrome.runtime.sendMessage({ type: "startScan", openUrls, chainInfo });
        }
    }
);

if (locationHref.indexOf('/accounts/label') > -1) {
    const addressQuery = 'tbody td a'
    // let labelQuery = 'tbody td.sorting_1'
    const labelQuery = 'tbody td:nth-child(2)'
    const urlQuery = 'div.card.mb-3 div.card-body span a'
    const addresses = Array.from(document.querySelectorAll(addressQuery));
    const labels = Array.from(document.querySelectorAll(labelQuery))
    const url = document.querySelector(urlQuery) || {};
    let addressResult = [];
    const labelName = locationHref.slice(locationHref.lastIndexOf("/") + 1, locationHref.lastIndexOf("?"))
    for (let i = 0; i < addresses.length; i++) {
        // 只选出 Name Tag下面有内容的
        if (labels[i].textContent) {
            // console.log("获取地址:", addresses[i], labels[i], url.href);
            const newAddress = {
                address: addresses[i].textContent,
                nameTag: labels[i].textContent,
                url: url.href ? url.href : "",
                labelName
            }
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

        const tabsQuery = "ul.nav.nav-custom.nav-borderless.nav_tabs li a"
        const tabs = Array.from(document.querySelectorAll(tabsQuery))
        const tabsList = tabs.map(a => a.getAttribute("val"))

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