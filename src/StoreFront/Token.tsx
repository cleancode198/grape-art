import { getRealm, getAllTokenOwnerRecords, SetRealmAuthorityArgs } from '@solana/spl-governance';
import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import { ENV, TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as React from 'react';
import BN from 'bn.js';
import { styled, useTheme } from '@mui/material/styles';
import {
  Typography,
  Button,
  Grid,
  Box,
  Paper,
  Avatar,
  Skeleton,
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableBody,
  TableFooter,
  TableRow,
  TablePagination,
  Collapse,
  Tooltip,
  CircularProgress,
  LinearProgress,
} from '@mui/material/';

//import {formatAmount, getFormattedNumberToLocale} from '../Meanfi/helpers/ui';
//import { PretifyCommaNumber } from '../../components/Tools/PretifyCommaNumber';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';

import moment from 'moment';

import Chat from '@mui/icons-material/Chat';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TimerIcon from '@mui/icons-material/Timer';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

import { ChatNavigationHelpers, useDialectUiId } from '@dialectlabs/react-ui';
import { GRAPE_BOTTOM_CHAT_ID } from '../utils/ui-contants';

import PropTypes from 'prop-types';
import { GRAPE_RPC_ENDPOINT, THEINDEX_RPC_ENDPOINT } from '../utils/grapeTools/constants';
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { RevokeCollectionAuthority } from '@metaplex-foundation/mpl-token-metadata';

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
}));

const GOVERNANNCE_STATE = {
    0:'Draft',
    1:'Signing Off',
    2:'Voting',
    3:'Succeeded',
    4:'Executing',
    5:'Completed',
    6:'Cancelled',
    7:'Defeated',
    8:'Executing with Errors!',
}

TablePaginationActions.propTypes = {
    count: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
};

function TablePaginationActions(props) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;
  
    const handleFirstPageButtonClick = (event) => {
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event) => {
        onPageChange(event, page - 1);
    };
  
    const handleNextButtonClick = (event) => {
        onPageChange(event, page + 1);
    };
  
    const handleLastPageButtonClick = (event) => {
        onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };
    
    return (
        <Box sx={{ flexShrink: 0, ml: 2.5 }}>
            <IconButton
                onClick={handleFirstPageButtonClick}
                disabled={page === 0}
                aria-label="first page"
            >
                {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
            </IconButton>
            <IconButton
                onClick={handleBackButtonClick}
                disabled={page === 0}
                aria-label="previous page"
            >
                {theme.direction === "rtl" ? (
                    <KeyboardArrowRight />
                ) : (
                    <KeyboardArrowLeft />
                )}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page"
            >
                {theme.direction === "rtl" ? (
                    <KeyboardArrowLeft />
                ) : (
                    <KeyboardArrowRight />
                )}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="last page"
            >
                {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
            </IconButton>
        </Box>
    );
  }

function RenderGovernanceMembersTable(props:any) {
    const [loading, setLoading] = React.useState(false);
    //const [proposals, setProposals] = React.useState(props.proposals);
    const members = props.members;
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - members.length) : 0;

    const { navigation, open } = useDialectUiId<ChatNavigationHelpers>(GRAPE_BOTTOM_CHAT_ID);

    const handleChangePage = (event:any, newPage:number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event:any) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    /*
    const getProposals = async (GOVERNANCE_PROGRAM_ID:string) => {
        if (!loading){
            setLoading(true);
            
        }
        setLoading(false);
    }*/

    //React.useEffect(() => { 
        //if (publicKey && !loading && realm)
        //    getProposals(realm);
    //}, [realm]);

    if(loading){
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress sx={{borderRadius:'10px;'}} />
            </Box>
            
        )
    }

    
        return (
            <Table>
                <TableContainer component={Paper} sx={{background:'none'}}>
                    <StyledTable sx={{ minWidth: 500 }} size="small" aria-label="Portfolio Table">
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography variant="caption"></Typography></TableCell>
                                <TableCell><Typography variant="caption">Member</Typography></TableCell>
                                <TableCell><Typography variant="caption">Total Votes</Typography></TableCell>
                                <TableCell><Typography variant="caption">Proposals</Typography></TableCell>
                                <TableCell><Typography variant="caption"></Typography></TableCell>
                                
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/*proposals && (proposals).map((item: any, index:number) => (*/}
                            {members && 
                            <>  
                                {(rowsPerPage > 0
                                    ? members.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : members
                                ).map((item:any, index:number) => (
                                <>
                                    {item?.pubkey && item?.account &&
                                        <TableRow key={index} sx={{borderBottom:"none"}}>
                                            <TableCell>
                                                <Typography variant="h6">
                                                    <Jazzicon diameter={25} seed={jsNumberForAddress(item.account.governingTokenOwner.toBase58())} />
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="h6">
                                                    {trimAddress(item.account.governingTokenOwner.toBase58(),6)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" >
                                                <Typography variant="h6">
                                                    {item.account.totalVotesCount}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" >
                                                <Typography variant="h6">
                                                    {item.account.outstandingProposalCount}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="h6">
                                                    
                                                {ValidateAddress(item.account.governingTokenOwner.toBase58()) &&
                                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        <Tooltip title="Send a direct message">
                                                            <Button
                                                                onClick={() => {
                                                                    open();
                                                                    navigation?.showCreateThread(item.account.governingTokenOwner.toBase58());
                                                                }}
                                                                sx={{
                                                                    textTransform: 'none',
                                                                    borderRadius: '17px',
                                                                    transition:
                                                                        'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                                                                
                                                                }}
                                                            >
                                                                <Chat
                                                                    sx={{ fontSize: 16, color: 'white' }}
                                                                />
                                                            </Button>
                                                        </Tooltip>
                                                    </Box>
                                                }
                                                    

                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    }
                                </>

                            ))}
                            </>
                            }
                        </TableBody>
                        
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                                colSpan={5}
                                count={members && members.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                SelectProps={{
                                    inputProps: {
                                    'aria-label': 'rows per page',
                                    },
                                    native: true,
                                }}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                ActionsComponent={TablePaginationActions}
                                />
                            </TableRow>
                        </TableFooter>
                        
                        
                    </StyledTable>
                </TableContainer>
            </Table>
        )
}

export function TokenView(props: any) {
    const collectionAuthority = props.collectionAuthority;
    const [loading, setLoading] = React.useState(false);
    const [members, setMembers] = React.useState(null);
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [realm, setRealm] = React.useState(null);
    
    const GOVERNANCE_PROGRAM_ID = 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';

    const getGovernanceMembers = async () => {
        if (!loading){
            setLoading(true);
            try{

                console.log("with governance: "+collectionAuthority.governance);

                const programId = new PublicKey(GOVERNANCE_PROGRAM_ID);
                const grealm = await getRealm(new Connection(THEINDEX_RPC_ENDPOINT), new PublicKey(collectionAuthority.governance))
                setRealm(grealm);

                const realmPk = grealm.pubkey;

                //console.log("realm: "+JSON.stringify(realm));
                const trecords = await getAllTokenOwnerRecords(new Connection(THEINDEX_RPC_ENDPOINT), grealm.owner, realmPk)

                //let sortedResults = trecords.sort((a,b) => (a.account?.outstandingProposalCount < b.account?.outstandingProposalCount) ? 1 : -1);
                const sortedResults = trecords.sort((a,b) => (a.account?.totalVotesCount < b.account?.totalVotesCount) ? 1 : -1);
                
                //console.log("trecords: "+JSON.stringify(trecords));
                setMembers(sortedResults);
            }catch(e){console.log("ERR: "+e)}
        } else{

        }
        setLoading(false);
    }

    React.useEffect(() => { 
        if (publicKey && !loading)
            getGovernanceMembers();
    }, [publicKey]);
    
    if (publicKey){
        if(loading){
            return (
                <Box
                    sx={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '17px',
                        p:4
                    }} 
                > 
                    <LinearProgress />
                </Box>
            )
        } else{
            if (members){
                return (
                    <Box
                        sx={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '17px',
                            p:4
                        }} 
                    > 
                        {realm &&
                            <>
                                <Typography variant="h4">
                                    {realm.account.name}

                                    <Button
                                        size='small'
                                        sx={{ml:1, color:'white', borderRadius:'17px'}}
                                        href={'https://realms.today/dao/'+collectionAuthority.governanceVanityUrl}
                                    >
                                        <OpenInNewIcon/>
                                    </Button>
                                </Typography>
                            </>
                        }
                    
                        <RenderGovernanceMembersTable members={members} />
                    </Box>
                                
                );
            }else{
                return (<></>);
            }
            
        }
    } else{
        // check if participant in this governance
        return (
            <Box
                sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '17px',
                    p:4
                }} 
            > 
                Connect your wallet
            </Box>
        )
    }
}