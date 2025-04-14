import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import { FC } from 'react';

export const Sol: FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    async function sendSol() {
        console.log("Sending a sol...");
        if (!publicKey) throw new WalletNotConnectedError();

        const recipientInput = prompt("Enter recipient's wallet address:");
        if (!recipientInput) {
            alert("Please enter a valid recipient address.");
            return;
    }
    const recipientAddress = new PublicKey(recipientInput);

        const amount = parseFloat(prompt("Enter amount to send:") || "0");
        if (isNaN(amount) || amount <= 0) {
            alert("Invalid amount");
            return;
        }
        

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: recipientAddress,
                lamports: amount,
            })
        );

        const signature = await sendTransaction(transaction, connection);

        console.log(`Sol transfer successful: ${signature}`);
    };

    return (
        <button onClick={sendSol} disabled={!publicKey}>
            Send Sol
        </button>
    );
};

export default Sol;