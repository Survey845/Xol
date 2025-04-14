import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    clusterApiUrl,
    Connection,
    Keypair,
    PublicKey,
    LAMPORTS_PER_SOL,
    Transaction,
} from "@solana/web3.js";
import {
    createMint,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    getMint,
    createMintToInstruction,
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction,
} from "@solana/spl-token";



function TokenMint() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const payer = Keypair.generate(); // Used to pay for transaction fees
    const { publicKey, sendTransaction} = useWallet();

    const [userTokens, setUserTokens] = useState<{ mint: PublicKey; name: string; mintAuthority: PublicKey}[]>([]);
    const [mintAuthorityAccounts, setMintAuthorityAccounts] = useState<{ mint: PublicKey; name: string; mintAuthority: PublicKey}[]>([]);

    const [selectedMintForMinting, setSelectedMintForMinting] = useState<string>("");
    const [selectedMintForSending, setSelectedMintForSending] = useState<string>("");


    async function getTokenAccounts() {
        if (!publicKey) return;

        let response = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID,
        });

        const tokens = response.value.map((accountInfo) => ({
            mint: new PublicKey(accountInfo.account.data["parsed"]["info"]["mint"]),
            name: `Token ${accountInfo.pubkey.toBase58().slice(0, 6)}`, // Placeholder name
            mintAuthority: new PublicKey(accountInfo.account.owner)
        }));

        const mint_tokens = (
            await Promise.all(
                response.value.map(async (accountInfo) => {
                    const mintAddress = new PublicKey(accountInfo.account.data["parsed"]["info"]["mint"]);
    
                    try {
                        // Fetch mint info to check mint authority
                        const mintInfo = await getMint(connection, mintAddress);
    
                        // Return token only if the connected wallet is the mint authority
                        if (mintInfo.mintAuthority?.equals(publicKey)) {
                            return {
                                mint: mintAddress,
                                name: `Token ${accountInfo.pubkey.toBase58().slice(0, 6)}`, // Placeholder name
                                mintAuthority: mintInfo.mintAuthority,
                            };
                        }
                        return null; // Exclude tokens where the wallet is not the mint authority
                    } catch (error) {
                        console.error(`Failed to fetch mint info for ${mintAddress.toBase58()}:`, error);
                        return null; // Exclude tokens if fetching fails
                    }
                })
            )
        ).filter((token) => token !== null);

        setUserTokens(tokens);
        setMintAuthorityAccounts(mint_tokens);
        
    }

    
    useEffect(() => {
        getTokenAccounts();
    }, [publicKey]);
    

    async function createToken() {
        console.log("Creating a token...");
        if(!publicKey){
            throw new Error("Unable to create a new token, your wallet is not connected!");
        }
        try{


            const fromAirdropSignature = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: fromAirdropSignature
            });

            let newToken = await createMint(
                connection,
                payer,
                publicKey,
                null,
                9
            )
            console.log(`The new token created is: ${newToken.toBase58()}`);

            let newTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                payer,
                newToken,
                publicKey,
            )
            console.log(`Create Token Account: ${newTokenAccount.address.toBase58()}`);

            getTokenAccounts();

        }
        catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error during creating token:", error.message);
            }
        }
    }


    

    async function mintToken() {

        if (!publicKey) {
            throw new Error("Wallet not connected");
        }

        if (!selectedMintForMinting) {
            alert("Please select a token to mint.");
            return;
        }

        const amount = parseFloat(prompt("Enter amount to mint:") || "0");
        if (isNaN(amount) || amount <= 0) {
            alert("Invalid amount");
            return;
        }

        try {
            const mintAddress = new PublicKey(selectedMintForMinting);

            // Mint authority check
            const mintInfo = await getMint(connection, mintAddress);
            console.log("Mint Authority:", mintInfo.mintAuthority?.toBase58());
            console.log("Your Wallet:", publicKey?.toBase58());

            let tokenAddress = await getAssociatedTokenAddress(
                mintAddress,
                publicKey,
            );

            let mintIx = await createMintToInstruction(
                mintAddress,
                tokenAddress,
                publicKey,
                amount
              );
              const tx = new Transaction().add(mintIx);
              tx.feePayer = publicKey;
              tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
              const signature = await sendTransaction(tx, connection);
              console.log(`Signature: ${signature}`);
              
              }


    
    catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error during minting:", error.message);
    
            if (error.message.includes("Signature verification failed")) {
                alert("Transaction failed: Your wallet may not be the mint authority.");
            } else if (error.message.includes("not found")) {
                alert("Error: The mint account or token account was not found.");
            } else {
                alert("An unexpected error occurred. Check the console for details.");
            }
        } else {
            console.error("Unknown error type:", error);
            alert("An unknown error occurred.");
        }
    }
}

    async function sendToken() {
        console.log("Sending a token...");
        const balance = await connection.getBalance(payer.publicKey);
        if (balance < 0.02 * LAMPORTS_PER_SOL) {
            const fromAirdropSignature = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: fromAirdropSignature
            });
            }
        if (!publicKey) {
            throw new Error("Wallet not connected");
        }

        if (!selectedMintForSending) {
            alert("Please select a token to mint.");
            return;
        }

        const amount = parseFloat(prompt("Enter amount to send:") || "0");
        if (isNaN(amount) || amount <= 0) {
            alert("Invalid amount");
            return;
        }

        const recipientInput = prompt("Enter recipient's wallet address:");
        if (!recipientInput) {
            alert("Please enter a valid recipient address.");
            return;
    }

        const mintAddress = new PublicKey(selectedMintForSending);

        const recipientAddress = new PublicKey(recipientInput);
        

        let tokenAddress = await getAssociatedTokenAddress(
            mintAddress,
            publicKey,
        );

        const recipientATA = await getOrCreateAssociatedTokenAccount(
            connection, // connection
            payer, // fee payer (still paying for the transaction)
            mintAddress, // mint
            recipientAddress, // owner (the recipient)
          );
          console.log(`Recipient ATA Address: ${recipientATA.address.toBase58()}`);
        
          const transferIx = createTransferInstruction(
            tokenAddress,
            recipientATA.address,
            publicKey,
            amount
          );
          console.log(`Transaction Signature: ${transferIx}`);

        const tx = new Transaction().add(transferIx);
        
        tx.feePayer = publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signature = await sendTransaction(tx, connection);

        console.log(`Transfer successful: ${signature}`);
    }

    return (
        <div>
            <h3>Mint Token Section</h3>

            <div>
            <button onClick={() => createToken()}>Create Token</button>
            </div>

            <div>
                <label>Select Token for Minting:</label>
                <select onChange={(e) => setSelectedMintForMinting(e.target.value)} value={selectedMintForMinting}>
                    <option value="">Select a token</option>
                    {mintAuthorityAccounts.map((token) => (
                        <option key={token.mint.toBase58()} value={token.mint.toBase58()}>
                            {token.name} ({token.mint.toBase58().slice(0, 6)}...)
                        </option>
                    ))}
                </select>
                <br />
                <button onClick={() => mintToken()}>Mint Token</button>
            </div>

            <div>
                <label>Select Token for Sending:</label>
                <select onChange={(e) => setSelectedMintForSending(e.target.value)} value={selectedMintForSending}>
                    <option value="">Select a token</option>
                    {userTokens.map((token) => (
                        <option key={token.mint.toBase58()} value={token.mint.toBase58()}>
                            {token.name} ({token.mint.toBase58().slice(0, 6)}...)
                        </option>
                    ))}
                </select>
                <br />
                <button onClick={() => sendToken()}>Send Token</button>
            </div>
        </div>
    );
}

export default TokenMint;