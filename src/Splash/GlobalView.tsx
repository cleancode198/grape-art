import React from "react";
import { Link } from "react-router-dom";

import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BN, web3 } from '@project-serum/anchor';
//import spok from 'spok';

import moment from 'moment';

import {
    Typography,
    Grid,
    Box,
    Button,
    ButtonGroup,
    Skeleton,
    Collapse,
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    InputBase,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Pagination,
    TablePagination,
} from '@mui/material';

import {
    AUCTION_HOUSE_PROGRAM_ID,
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    WRAPPED_SOL_MINT,
    TOKEN_PROGRAM_ID,
} from '../utils/auctionHouse/helpers/constants';

import { getMetadata, deserializeAccount, deserializeReceipt } from '../utils/auctionHouse/helpers/accounts';

import { AuctionHouseProgram  } from '@metaplex-foundation/mpl-auction-house';
import { dataBeet, Metadata } from '@metaplex-foundation/mpl-token-metadata';

import { 
    GRAPE_RPC_ENDPOINT,
    GRAPE_PROFILE,
    THEINDEX_RPC_ENDPOINT,
} from '../utils/grapeTools/constants';

import { MakeLinkableAddress, ValidateCurve, trimAddress, timeAgo, formatBlockTime } from '../utils/grapeTools/WalletAddress'; // global key handling

import { TokenAmount } from '../utils/grapeTools/safe-math';

import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BallotIcon from '@mui/icons-material/Ballot';
import SellIcon from '@mui/icons-material/Sell';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircularProgress from '@mui/material/CircularProgress';
import CancelIcon from '@mui/icons-material/Cancel';
import { ConstructionOutlined, SentimentSatisfiedSharp } from "@mui/icons-material";
import { accountSize } from "@project-serum/anchor/dist/cjs/coder";

import { decodeMetadata } from '../utils/grapeTools/utils';

function convertSolVal(sol: any){
    try{
        sol = parseFloat(new TokenAmount(sol, 9).format()).toFixed(4);
    }catch(e){console.log("ERR: "+e)}
    return sol;
}

//get page function
//const getPage = async (page, perpage) => {
export async function getPage(myArray: any, page: number, perPage: number): Promise<any []> {
    //console.log('myArray:', myArray, 'page:', page, 'perPage:', perPage);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const ticonnection = new Connection(GRAPE_RPC_ENDPOINT);
    const paginatedPublicKeys = myArray[0].slice(
        (page - 1) * perPage,
        page * perPage,
    );

    if (paginatedPublicKeys.length === 0) {
        return [];
    } 
    const accountsWithData = await ticonnection.getMultipleAccountsInfo(paginatedPublicKeys);
    //return accountsWithData;
    let myReceipts = [];
    let receiptInfoDs: any;

    for (var metavalue of accountsWithData){
        if (metavalue?.data){
            try{
                let buf = Buffer.from(metavalue.data);
                //deserialize depending on size of the receipt passed
                receiptInfoDs = deserializeReceipt(buf, metavalue.data.byteLength);
                myReceipts.push(receiptInfoDs[0]);
            }catch(etfm){console.log("ERR: "+etfm + " for "+ JSON.stringify(metavalue));}
        } else{
            console.log("Something not right...");
        }
    }

    const receipts = (await Promise.all(myReceipts))
    .flat()
    .map(receipt => ({
        ...receipt,
        tokenSize: new BN(receipt.tokenSize).toNumber(),
        price: new BN(receipt.price).toNumber() / LAMPORTS_PER_SOL,
        createdAt: new BN(receipt.createdAt).toNumber(),
        mintpk: receipt.metadata,
        //mintpk: getMintFromMetadata(receipt.metadata),
        //mint: getMintFromReceipt(receipt.tradeState.toBase58()),
        //cancelledAt: receipt?.canceledAt,           
    }));
    receipts.sort((a:any,b:any) => (a.createdAt < b.createdAt) ? 1 : -1); 
    return receipts;
    //setReceipts(receipts);
}

export async function getMintFromMetadata (
    metaData: web3.PublicKey,
  ): Promise<string> {
    let value = 'N/A';
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const metaSignature = await ggoconnection.getConfirmedSignaturesForAddress2(metaData, {limit:2});
    const mintPk = (await ggoconnection.getParsedTransaction(metaSignature[0].signature, 'confirmed'));
    //console.log('metaData:', metaData, 'JSON FILE:' +JSON.stringify(mintPk));
    //console.log('MINTPK:',mintPk.meta.preTokenBalances[0]?.mint.toString());
    let mintExists = mintPk.meta.preTokenBalances[0]?.mint; 
    if (mintExists) {
        value = mintPk.meta.preTokenBalances[0]?.mint.toString();
    }
    return (value);   
  };

export default function GlobalView(props: any){
    const [history, setHistory] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [historyME, setMEHistory] = React.useState(null);
    const [statsME, setMEStats] = React.useState(null);
    const [openMEHistory, setMEOpenHistory] = React.useState(0);
    const [mint, setMint] = React.useState(props.mint || null);
    const [symbol, setSymbol] = React.useState(props.symbol || null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const ticonnection = new Connection(THEINDEX_RPC_ENDPOINT);   
    const { connection } = useConnection();

    const [receiptListing, setReceiptListing] = React.useState(null);
    const [receiptPurchase, setReceiptPurchase] = React.useState(null);
    const [receiptBid, setReceiptBid] = React.useState(null);
    const [myArray, setMyArray] = React.useState(null);
    const [receipts, setReceipts] = React.useState(null);
    const [totalResults, setTotalResults] = React.useState(null);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);

    const getPaging = async (page: number, rowsPerPage: number) => {
        setLoading(true);
        {
        
            const PrintListingReceiptSize = 236;
                const PrintBidReceiptSize = 269;
                const PrintPurchaseReceiptSize = 193;

                const AhLocation1 = 72;
                const AhLocation2 = 104;

            const ReceiptAccountSizes2 = [
                {size: PrintListingReceiptSize, ahPosition: AhLocation1},
                {size: PrintBidReceiptSize, ahPosition: AhLocation1},
                {size: PrintPurchaseReceiptSize, ahPosition: AhLocation2}
            ];
            
            let myArray = [];

            const ReceiptAccounts = await (Promise.all(ReceiptAccountSizes2.map(async ({size, ahPosition}) => {
            const accounts = await ticonnection.getProgramAccounts(
                AUCTION_HOUSE_PROGRAM_ID,
                {
                dataSlice: { offset: 0, length: 0 }, 
                //commitment: 'confirmed',
                filters: [
                    {
                    dataSize: size,
                    },
                    {
                    memcmp: {
                        offset: ahPosition,
                        bytes: "7bgahjaMKFgwK3jSx5RQjdxSQ67wkfPWMCNCmtiPy65L",
                    },
                    },
                ],
                }
            )
            myArray.push(accounts.map(account => account.pubkey));
            })));

            //place the elements of the array in a single index/row
            if (myArray[1].length > 0) {
                for (var i = 1; i < myArray.length; i++) {
                    let myArrayLength = myArray[i].length;
                    for (var j = 0; j < myArrayLength; j++) {
                        let getlastPosition = myArray[i].length - 1;
                        const element = myArray[i].splice(getlastPosition, 1);
                        let toIndex = myArray[0].length;
                        myArray[0].splice(toIndex, 0, element[0]);
                    }
                }
            }   

            //set number of elements per page
            if (rowsPerPage === null) {
                rowsPerPage = 5;
            }
            let pageOn = 1;
            if (page === null){
                page = pageOn - 1;
            } else {
                pageOn = (page + 1);
            }
            setTotalResults(myArray[0].length);
            setMyArray(myArray);
            const pageData = await getPage(myArray, pageOn, rowsPerPage);
            setReceipts(pageData);
        }
        setLoading(false);

    }   

    const ShowListings = (props: any) => {
        const [open_listing_collapse, setOpenListingCollapse] = React.useState(true);
        const [openListing, setOpenListing] = React.useState(0);
        const listing = props.listing;
        const title = props.title;

        const handleClick = () => {
            setOpenListingCollapse(!open_listing_collapse);
        }

        const handleChangePage = async (event, newPage) => {

            const receipts = await getPage(myArray, newPage+1, rowsPerPage);
            setReceipts(receipts);
            setTotalResults(myArray[0].length);
            setPage(newPage);
        }

        const handleChangeRowsPerPage = async (event) => {

            setRowsPerPage(parseInt(event.target.value));
            const receipts = await getPage(myArray, 1, parseInt(event.target.value));
            setReceipts(receipts);
            setTotalResults(myArray[0].length);
            setPage(0);
        }

        return (
            <>
                <Box
                    sx={{ 
                        p: 1, 
                        mb: 3, 
                        width: '100%',
                        background: '#13151C',
                        borderRadius: '24px'
                    }}
                > 
                    <ListItemButton onClick={handleClick}
                        sx={{borderRadius:'20px'}}
                    >
                        <ListItemIcon>
                        <BarChartOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText 
                            primary='History'
                        />
                            <Typography variant="caption"><strong>{totalResults}</strong></Typography>
                            {open_listing_collapse ? <ExpandLess /> : <ExpandMoreIcon />}
                    </ListItemButton>
                    <Collapse in={open_listing_collapse} timeout="auto" unmountOnExit>
                        <List component="div" 
                            sx={{ 
                                width: '100%',
                            }}>
                            
                            <ListItemText>
                                <Box sx={{ margin: 1 }}>
                                    {/*<div style={{width: 'auto', overflowX: 'scroll'}}>*/}
                                    <TableContainer>
                                        <Table size="small" aria-label="purchases">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><Typography variant="caption">tradeState</Typography></TableCell>
                                                    <TableCell><Typography variant="caption">bookkeeper</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">auctionHouse</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">seller</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">buyer</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">metadata</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">price</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">createdAt</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">purchaseReceipt</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">receipt_type</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">mint</Typography></TableCell>
                                                </TableRow>

                                            </TableHead>

                                            <TableBody>
                                                {listing && listing.map((item: any) => (
                                                    <TableRow>
                                                        <TableCell>
                                                            {item?.tradeState &&
                                                                <Tooltip title={JSON.stringify(item)}>
                                                                    <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item?.tradeState.toBase58()}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                        {trimAddress(item?.tradeState.toBase58(),3)}
                                                                    </Button>   
                                                                </Tooltip>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.bookkeeper &&
                                                                <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item?.bookkeeper.toBase58()}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                    {trimAddress(item?.bookkeeper.toBase58(),3)}
                                                                </Button>   
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.auctionHouse &&
                                                                <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item?.auctionHouse.toBase58()}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                    {trimAddress(item?.auctionHouse.toBase58(),3)}
                                                                </Button>   
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.seller &&
                                                                <>
                                                                {trimAddress(item?.seller.toBase58(),3)}
                                                                </>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.buyer &&
                                                                <>
                                                                {trimAddress(item?.buyer.toBase58(),3)}
                                                                </>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.metadata &&
                                                                <>
                                                                {trimAddress(item?.metadata.toBase58(),3)}
                                                                </>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.price &&
                                                                <>
                                                                {item?.price} 
                                                                </>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.createdAt &&
                                                                <>
                                                               {moment.unix(item?.createdAt).format('YYYY-MM-DD h:mma')} 
                                                               </>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.purchaseReceipt &&
                                                                <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item?.purchaseReceipt.toBase58()}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                    {trimAddress(item?.purchaseReceipt.toBase58(),3)}
                                                                </Button>   
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.receipt_type &&
                                                                <>
                                                                {item?.receipt_type} 
                                                                </>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.mintPk &&
                                                                <>
                                                                {item?.mintPk}
                                                                </>
                                                            }  
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <TablePagination
                                            rowsPerPageOptions={[5,10,25]}
                                            component="div"
                                            count={totalResults}
                                            page={page}
                                            onPageChange={handleChangePage}
                                            rowsPerPage={rowsPerPage}
                                            onRowsPerPageChange={handleChangeRowsPerPage}
                                        />
                                    </TableContainer>
                                </Box>
                            </ListItemText>    
                        </List>
                    </Collapse>
                </Box>

            </>
        );
    }

    React.useEffect(() => {
        if (!loading){
            if (!receipts){
                getPaging(page, rowsPerPage);
            }
        }
    },[]);

    if (loading){
        
        return (
            <Box
                sx={{ 
                    p: 1, 
                    mb: 3, 
                    width: '100%',
                    background: '#13151C',
                    borderRadius: '24px'
                }}
            > 
                <Skeleton
                    sx={{ 
                        height: '100%',
                        width: '100%'
                    }}
                />
            </Box>
        )
    } else{  

        return ( 
            <> 
                {receipts &&
                    <>
                        <ShowListings listing={receipts} title="Receipts"/>
                    </>
                }
            </>
        )
    }

}