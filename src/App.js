import "./styles/App.css";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import myEpicNft from "./utils/MyEpicNFT.json";

const TWITTER_HANDLE = "4k7hB";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "";
const TOTAL_MINT_COUNT = 50;
// コトントラクトアドレスをCONTRACT_ADDRESS変数に格納
const CONTRACT_ADDRESS = "0x416d80C12f0AB7643b2d83b5637D35C0E5bE535";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  // ミント回数を格納するための状態変数を定義します。
  const [mintCount, setMintCount] = useState(0);
  // ローディング中のアニメーションを作成します。
  const [loading, setLoading] = useState(true);
  // 適切なネットワークにいるか確認します。
  const [isNetworkOk, setIsNetworkOk] = useState(false);

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `あなたのウォレットに NFT を送信しました。OpenSea に表示されるまで最大で10分かかることがあります。NFT へのリンクはこちらです: https://testnets.opensea.io/assets/goerli/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      // Goerliを利用しているか確認します。:
      let chainId = await ethereum.request({ method: "eth_chainId" });
      console.log("Connected to chain " + chainId);
      // 0x5 は　Goerli の ID です。
      const goerliChainId = "0x5";
      if (chainId !== goerliChainId) {
        setIsNetworkOk(false);
        alert("You are not connected to the Goerli Test Network!");
      }
      if (chainId === goerliChainId) {
        setIsNetworkOk(true);
      }

      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);

      // ウォレットアドレスを currentAccount に紐付けます。
      setCurrentAccount(accounts[0]);

      // イベントリスナーを設定
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      // ローディング中にします。
      setLoading(true);
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.");
        await nftTxn.wait();
        console.log(nftTxn);
        console.log(
          `Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`
        );
        // ローディング中を解除します。
        setLoading(false);
      } else {
        // ローディング中を解除します。
        setLoading(false);
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      // ローディング中を解除します。
      setLoading(false);
      console.log(error);
    }
  };

  useEffect(() => {
    // ローディング中にします。 
    setLoading(true);
    checkIfWalletIsConnected();
    getMintCount();
    // ローディング中を解除します。
    setLoading(false);
  }, []);

  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  const renderMintUI = () => (
    <button
      onClick={askContractToMintNft}
      className="cta-button connect-wallet-button"
      // Goerliでない場合には利用できないようにします。
      disabled={!isNetworkOk}
    >
      Mint NFT
    </button>
  );

  // Mintの数を取得します。
  const getMintCount = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        let number = await connectedContract.TotalMintCount();
        if (!number) return;
        setMintCount(number.toNumber() - 1);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">あなただけの特別な NFT を Mint しよう💫</p>
          {/*条件付きレンダリング。
          // すでにウォレット接続されている場合は、
          // Mint NFT を表示する。*/}
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : renderMintUI()}

          {/* ネットワークが適切かAlertします。 */}
          {!isNetworkOk ? (
            <p className="sub-text animate-pulse  text-orange-500">
              You are not in Goerli Network...
            </p>
          ) : (
            <p className="sub-text text-green-500">
              You are in Goerli Network!
            </p>
          )}

          {/* ローディング中か表示します。 */}
          {loading ? (
            <p className="sub-text animate-pulse  text-orange-500">
              Loading...
            </p>
          ) : (
            // Mintされた回数を表示します。
            <p className="sub-text text-green-500">
              これまでに作成されたNFTの数 {mintCount}/{TOTAL_MINT_COUNT} NFT
            </p>
          )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
