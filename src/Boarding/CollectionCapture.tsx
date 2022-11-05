import React, { useEffect, useState, useCallback, memo, Suspense } from "react";

import {
    Box,
    TextField,
    Button,
    LinearProgress,
    Typography,
    Stack
} from '@mui/material';

import { PublicKey } from "@solana/web3.js"

import { LinearProgressProps } from '@mui/material/LinearProgress';

export function CollectionCaptureView (this: any, props: {
        setGovernance: (governance: PublicKey) => void,
        setName: (name: string ) => void,
        setVanityUrl: (url: string) => void,
        setMetaDataUrl: (url: string) => void,
        setVerifiedCollectionAddress: (address: PublicKey) => void
        setUpdateAuthority: (address: PublicKey) => void
        setAuctionHouse: (address: PublicKey) => void
        setCreatorAddress: (address: PublicKey) => void
        setTokenType: (type: string) => void
    }) {
    const [collectionAddress, setCollectionAddress] = React.useState(null);
    const [updateAuthorityAddress, setUpdateAuthorityAddress] = React.useState(null);
    const [progress, setProgress] = React.useState(0);
    const [status, setStatus] = React.useState(null);
    const [MAX, setMax] = React.useState(100);
    const MIN = 0;

    return (
        
            <Stack
                component="form"
                m={2}
                sx={{
                    width: '25ch',
                }}
                spacing={2}
                noValidate
                autoComplete="off"
                >
                <TextField 
                    fullWidth 
                    label="Collection Name" 
                    onChange={(e) => props.setName(e.target.value)}
                />
                <TextField 
                    fullWidth 
                    label="Author (leave blank if the name is the same as the collection name)" 
                    //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
                />
                <TextField 
                    fullWidth 
                    label="Description" 
                    //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
                />

                <TextField 
                    fullWidth 
                    label="Meta-data URL"
                    onChange={(e)=> props.setMetaDataUrl(e.target.value)}
                />
                <TextField
                    fullWidth
                    label="Vanity URL"
                    onChange={(e)=> props.setVanityUrl(e.target.value)}
                />
                <TextField
                    fullWidth
                    label="Token Type"
                    onChange={(e)=>props.setTokenType(e.target.value)}
                />
                {/*
                <TextField 
                    fullWidth 
                    label="Discord" 
                    //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
                />

                <TextField 
                    fullWidth 
                    label="Twitter" 
                    //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
                />
                */}

                <TextField 
                    fullWidth 
                    label="Governance Address"
                    onChange={(e) =>
                        props.setGovernance( new PublicKey(e.target.value))}
                />
                <TextField
                    fullWidth
                    label="Auction House"
                    onChange={(e) =>
                        props.setAuctionHouse( new PublicKey(e.target.value))}
                />
                <TextField
                    fullWidth
                    label="Update Authority"
                    onChange={(e) =>
                        props.setUpdateAuthority( new PublicKey(e.target.value))}
                />                
                
                <TextField
                    fullWidth
                    label="Verified Collection Address"
                    onChange={(e) =>
                        props.setVerifiedCollectionAddress( new PublicKey(e.target.value))}
                />

                <TextField
                    fullWidth
                    label="Creator Address (for editions)"
                    onChange={(e) =>
                        props.setCreatorAddress( new PublicKey(e.target.value))}
                />

                <TextField 
                    fullWidth 
                    label="Random Mint Sample"
                    //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
                />


                
            </Stack>
            
    );
}