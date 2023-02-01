/*global chrome*/
import { switchDate } from '../../../utils/util';
import './home.scss'

function Home() {
    // 设置路由钩子

    const getLabels = (e) => {
        const chainWebsite = e.target.dataset.chain
        let chainInfo = {
            time: switchDate(new Date()),
        }

        if (chainWebsite === "etherscan") {
            chainInfo.chainName = "Etherscan"
        } else if (chainWebsite === "bscscan") {
            chainInfo.chainName = "Bscscan"
        } else if (chainWebsite === "polygon") {
            chainInfo.chainName = "Polygon"
        }
        console.log("+++++++key", chainInfo);

        // popup => content
        // 这里更好的是实现点击按钮后打开新的目标页面 但是现在这样操作目标页无法获取到信息
        chrome.tabs.query({
            active: true,
            currentWindow: true,
        }, function (tabs) {
            var tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, { type: "getUrls", chainInfo });
        });


        // --------
        // 为什么popup好像无法获取到页面的dom元素了 但是之前的插件中就可以在这里实现并且是在页面的控制台打印
        // Chrome 插件中的 popup 页面不能直接获取当前页面的 DOM 元素，因为它是一个独立的页面，并且存在跨域安全限制。
        // 发现之前的插件获取到是因为他直接把popup页面整个用ifame嵌到了content中 所以实际上执行的还是content的内容
    }

    return (
        <div className="home">
            <div>
                <div className="btn-wrap">
                    {/* https://etherscan.io/labelcloud */}
                    <a href="https://etherscan.io/labelcloud">https://etherscan.io/labelcloud</a>
                    <button data-chain="etherscan" className="niceButton" onClick={(e) => { getLabels(e) }}>开始抓取(etherscan)</button>
                </div>
                <div className="btn-wrap">
                    {/* https://bscscan.com/labelcloud */}
                    <a href="https://bscscan.com/labelcloud">https://bscscan.com/labelcloud</a>
                    <button data-chain="bscscan" className="niceButton" onClick={(e) => { getLabels(e) }}>开始抓取(bscscan)</button>
                </div>
                <div className="btn-wrap">
                    {/* https://polygonscan.com/labelcloud */}
                    <a href="https://polygonscan.com/labelcloud">https://polygonscan.com/labelcloud</a>
                    <button data-chain="polygon" className="niceButton" onClick={(e) => { getLabels(e) }}>开始抓取(polygon)</button>
                </div>
            </div>
        </div >
    )
}

export default Home