import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { useAccount, useNetwork, useWalletClient, usePublicClient, useSwitchNetwork } from 'wagmi'
import { supportedChains, chainsDetails } from '../constants';
import { ethers } from "ethers";
import { useAlert, positions } from 'react-alert';
import gasABI from "./../gasABI.json";

function Liquidity ({chainId}) {
    const {address, isConnected} = useAccount()
    const { data: signer } = useWalletClient();
    const provider = usePublicClient();
    const {chain} = useNetwork()
    const { switchNetwork } = useSwitchNetwork()
    const alert = useAlert()

    let chainDetail = chainsDetails[chainId]
    const [viewLiquidity, setViewLiquidity] = useState(false)
    const [addLiquidityAmt, setAddLiquidityAmt] = useState(0)
    const [removeLiquidityAmt, setRemoveLiquidityAmt] = useState(0)
    const [addLiquidityLoading, setAddLiquidityLoading] = useState(false)
    const [removeLiquidityLoading, setRemoveLiquidityLoading] = useState(false)
    const [totalLiquidity, setTotalLiquidity] = useState(0)
    const [myStake, setMyStake] = useState(0)
    const [myRewards, setMyRewards] = useState(0)
    const [loading, setloading] = useState(true)

    useEffect(() => {
        calculatePrice();
    },[])

    // Create promise that gets resolved in time milliseconds
    function delay(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    const calculatePrice = async () => {
        setloading(true)
        const _provider = new ethers.JsonRpcProvider(chainDetail.rpc);
        const gasContract = new ethers.Contract(chainDetail.contract, gasABI, _provider);
        
        let contractBalance = await _provider.getBalance(chainDetail.contract);
        setTotalLiquidity(ethers.formatEther(contractBalance));

        let _myStake = await gasContract.getDeposits(address);
        setMyStake(ethers.formatEther(_myStake));

        let _myRewards = await gasContract.getTotalRewards(address);
        setMyRewards(ethers.formatEther(_myRewards));
        setloading(false)
    }

    const addLiquidity = async () => {
        setAddLiquidityLoading(true)
        if(addLiquidityAmt > 0) { 
            if (chainId !== chain.id) {
                switchNetwork?.(chainId)
            } else {
                try{
                    const gasContract = new ethers.Contract(chainDetail.contract, gasABI, provider);
                    const signedContract = gasContract.connect(signer)
                    const txnReceipt = await signedContract.Deposit({value: ethers.parseUnits(addLiquidityAmt.toString(), "ether")});
                    console.log(txnReceipt);
                    alert.success(
                        <div>
                            <div>transaction sent</div>
                            <button className='text-xs' onClick={()=> window.open(chainDetail.explorer + txnReceipt.hash, "_blank")}>View on explorer</button>
                        </div>, {
                        timeout: 6000,
                        position: positions.BOTTOM_RIGHT
                    });
                    setAddLiquidityAmt(0);
                } catch(e) {
                    alert.error(<div>something went wrong</div>, {
                        timeout: 6000,
                        position: positions.BOTTOM_RIGHT
                    });
                }
            }
        }
        setAddLiquidityLoading(false)
    }

    const removeLiquidity = async () => {
        setRemoveLiquidityLoading(true)
        await calculatePrice();
        if(removeLiquidityAmt > myStake) {
            alert.error(<div>invalid input</div>, {
                timeout: 6000,
                position: positions.BOTTOM_RIGHT
            });
        } else if(removeLiquidityAmt > 0) { 
            if (chainId !== chain.id) {
                switchNetwork?.(chainId)
            } else {
                try{
                    const gasContract = new ethers.Contract(chainDetail.contract, gasABI, provider);
                    const signedContract = gasContract.connect(signer)
                    const txnReceipt = await signedContract.Withdraw(ethers.parseUnits(removeLiquidityAmt.toString(), "ether"));
                    console.log(txnReceipt);
                    alert.success(
                        <div>
                            <div>transaction sent</div>
                            <button className='text-xs' onClick={()=> window.open(chainDetail.explorer + txnReceipt.hash, "_blank")}>View on explorer</button>
                        </div>, {
                        timeout: 6000,
                        position: positions.BOTTOM_RIGHT
                    });
                    setRemoveLiquidityAmt(0);
                } catch(e) {
                    alert.error(<div>something went wrong</div>, {
                        timeout: 6000,
                        position: positions.BOTTOM_RIGHT
                    });
                }
            }
        }
        setRemoveLiquidityLoading(false)
    }

    return (
        <div>
            <div onClick={() => setViewLiquidity(!viewLiquidity)} className={`rounded cursor-pointer ${viewLiquidity ? "bg-gray-200 text-[#D631B9]" : ""} hover:bg-gray-200 hover:text-[#D631B9] flex w-full h-16 items-center justify-between px-2 space-x-4 py-10`}>
                <div className='flex items-center space-x-2 lg:space-x-4'>
                    <img alt="" src={chainDetail.image} className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10"/>
                    <div className='text-sm md:text-md lg:text-lg xl:text-xl'>{chainDetail.name}</div>
                </div>
                <div className='flex space-x-1 md:space-x-2 lg:space-x-4 xl:space-x-6 items-center text-sm xl:text-md'>
                    <div className='flex lg:w-44 xl:w-48'>
                        <div className='text-xs md:text-sm sm:w-24 md:w-28 lg:text-md lg:w-32 xl:text-lg'>Total Liquidity: </div>
                        <div className='flex items-center justify-center pl-1 md:pl-2 xl:pl-4 text-xs md:text-sm xl:text-md'> {loading ?<div className='animate-pulse sm:w-[20px] md:w-[40px] text-xs md:text-sm xl:text-md h-full bg-[#2362C0]'></div> : +parseFloat(totalLiquidity).toFixed(4)}</div>
                    </div>
                    <div className='w-1/12'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></div>
                </div>
            </div>
            {
                viewLiquidity ?
                isConnected ?
                <div className='w-full border rounded bg-gray-200 text-black py-4 space-y-2 px-2 my-2 mb-4'>
                    <div className='flex justify-between space-x-4'>
                        <input onChange={(e) => setAddLiquidityAmt(e.target.value)} placeholder='Enter amount to deposit' type="number" className='w-full px-4 rounded-[8px] bg-gray-100 border-slate-300 text-md shadow-sm focux:bg-white focus:outline-none focus:border-2 focus:ring-1 focus:ring-[#E6FB04]' />
                        <button onClick={() => addLiquidity()} className='text-white flex justify-center items-center rounded-lg px-6 bg-[#2362C0] text-sm font-semibold w-4/12'>
                            {
                                addLiquidityLoading ? 
                                <svg class="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                : <div> Add Liquidity </div>
                            } 
                        </button>
                    </div>
                    {
                        myStake > 0 ? 
                        <div className='flex justify-between space-x-4'>
                            <input onChange={(e) => setRemoveLiquidityAmt(e.target.value)} placeholder='Enter amount to withdraw' type="number" className='w-full px-4 rounded-[8px] bg-gray-100 border-slate-300 text-md shadow-sm focux:bg-white focus:outline-none focus:border-2 focus:ring-1 focus:ring-[#E6FB04]' />
                            <button onClick={() => removeLiquidity()} className='text-white flex justify-center items-center rounded-lg px-6 bg-[#2362C0] text-sm font-semibold w-4/12'>
                                {
                                    removeLiquidityLoading ?
                                    <svg class="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    : <div> Remove Liquidity </div>
                                }
                            </button>
                        </div>
                    : ""
                    }
                    <div className='flex flex-row justify-between items-center'>
                        <div className='flex text-gray-500 text-sm'>My Stake: <div className='font-semibold pl-1'>{+parseFloat(myStake).toFixed(4)}</div></div>
                        <div className='flex items-center space-x-2'>
                            <div className='flex text-gray-500 text-sm'>My Rewards: <div className='font-semibold pl-1'>{+parseFloat(myRewards).toFixed(6)}</div></div>
                            {
                                myRewards > 0 ? <button className='rounded-lg px-2 py-2 bg-[#E6FB04] text-xs font-semibold'>Claim</button> : ""
                            }
                        </div>
                    </div>
                </div> : <div className='flex items-center justify-center w-full border rounded bg-gray-200 text-black py-4 space-y-2 px-2'><ConnectButton chainStatus="icon" showBalance={false} accountStatus="avatar"/></div>
                : ""
            }
        </div>
    )
}

function Dashboard () {
    
    return (
        <div className='h-5/6 w-full'>
            <div className='fixed right-0'>
                <svg width="200" height="900" viewBox="0 0 1089 1080" fill="none" xmlns="http://www.w3.org/2000/svg" class="sm-hidden"><path d="M190 -7.50003C2433 183 -984.138 669.212 1098.13 906.712" stroke="white" stroke-width="4" opacity="1" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="1px 1px"></path><path d="M342.5 -9.5C2472.91 164.456 -964.869 688.904 1161.08 887.349" stroke="white" stroke-width="8" opacity="1" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="1px 1px"></path></svg>
            </div>
            <div className="flex items-center w-full h-full justify-center pt-14">
                <div className="rounded-lg h-full w-3/6 border border-4 bg-[#D631B9] border-white text-white p-4">
                    <div className='flex items-center justify-center w-full text-lg md:text-xl lg:text-2xl border-b-2 border-white pb-6 pt-2'>Single Token Earn</div>
                    <div className='h-5/6 overflow-y-auto mt-2 space-y-4'>
                        {supportedChains.map(chainId => {
                            return (
                                <Liquidity chainId={chainId}/>
                            )
                        })}
                    </div>
                </div>
                <div className='z-0 w-[500px]'>
                    <img className='h-[700px]' src="https://www.hyperlane.xyz/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fspaceman.1ba4897b.webp&w=2048&q=75"/>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;