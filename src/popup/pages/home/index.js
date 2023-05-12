/*global chrome*/
import { switchDate } from '../../../utils/util';
import './home.scss'

function Home() {
    // 设置路由钩子

    const getLabels = (e) => {
        const [queryType, chainWebsite] = e.target.dataset.chain.split("-")

        let chainInfo = {
            time: switchDate(new Date()),
        }
        chainInfo.queryType = queryType

        if (chainWebsite === "etherscan") {
            chainInfo.chainName = "Etherscan"
            chainInfo.chainId = "1"
        } else if (chainWebsite === "bscscan") {
            chainInfo.chainName = "Bscscan"
            chainInfo.chainId = "56"
        } else if (chainWebsite === "polygon") {
            chainInfo.chainName = "Polygon"
            chainInfo.chainId = "137"
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


    }

    return (
        <div className="home">
            <div className='wrap'>
                Get Accounts
                <div className="btn-wrap">
                    {/* https://etherscan.io/labelcloud */}
                    <a href="https://etherscan.io/labelcloud">https://etherscan.io/labelcloud</a>
                    <button data-chain="accounts-etherscan" className="niceButton" onClick={(e) => { getLabels(e) }}>开始抓取(etherscan)</button>
                </div>
                <div className="btn-wrap">
                    {/* https://bscscan.com/labelcloud */}
                    <a href="https://bscscan.com/labelcloud">https://bscscan.com/labelcloud</a>
                    <button data-chain="accounts-bscscan" className="niceButton" onClick={(e) => { getLabels(e) }}>开始抓取(bscscan)</button>
                </div>
                <div className="btn-wrap">
                    {/* https://polygonscan.com/labelcloud */}
                    <a href="https://polygonscan.com/labelcloud">https://polygonscan.com/labelcloud</a>
                    <button data-chain="accounts-polygon" className="niceButton" onClick={(e) => { getLabels(e) }}>开始抓取(polygon)</button>
                </div>
            </div>
            <div className='wrap'>
                Get Tokens
                <div className="btn-wrap">
                    {/* https://etherscan.io/labelcloud */}
                    <a href="https://etherscan.io/labelcloud">https://etherscan.io/labelcloud</a>
                    <button data-chain="tokens-etherscan" className="niceButton" onClick={(e) => { getLabels(e) }}>开始抓取(etherscan)</button>
                </div>
                <div className="btn-wrap">
                    {/* https://bscscan.com/labelcloud */}
                    <a href="https://bscscan.com/labelcloud">https://bscscan.com/labelcloud</a>
                    <button data-chain="tokens-bscscan" className="niceButton" onClick={(e) => { getLabels(e) }}>开始抓取(bscscan)</button>
                </div>
                <div className="btn-wrap">
                    {/* https://polygonscan.com/labelcloud */}
                    <a href="https://polygonscan.com/labelcloud">https://polygonscan.com/labelcloud</a>
                    <button data-chain="tokens-polygon" className="niceButton" onClick={(e) => { getLabels(e) }}>开始抓取(polygon)</button>
                </div>
            </div>
        </div >
    )
}

export default Home