import { clusterApiUrl, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

interface TxData {
    signature: string;
    date: string;
    status: string;
    instructions: string[];
}

function TransactionHistory() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const { publicKey } = useWallet();
    const [transactions, setTransactions] = useState<TxData[]>([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!publicKey) return;
    
            try {
                const txList = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
    
                const txDataList: TxData[] = [];
    
                for (let i = 0; i < txList.length; i++) {
                    const txInfo = txList[i];
                    const parsedTx = await connection.getParsedTransaction(txInfo.signature, {
                        maxSupportedTransactionVersion: 0,
                    });
    
                    if (!parsedTx) continue;
    
                    const blockTime = txInfo.blockTime || 0;
                    const date = new Date(blockTime * 1000).toLocaleString();
                    const signature = txInfo.signature;
                    const status = txInfo.confirmationStatus || "unknown";
    
                    const instructions = parsedTx.transaction.message.instructions.map((ix) =>
                        "programId" in ix ? ix.programId.toBase58() : "Unknown"
                    );
    
                    txDataList.push({
                        signature,
                        date,
                        status,
                        instructions,
                    });
    
                    // Throttle to avoid 429 errors
                    await new Promise((res) => setTimeout(res, 150));
                }
    
                setTransactions(txDataList);
            } catch (err) {
                console.error("Error fetching transaction history:", err);
            }
        };
    
        fetchTransactions();
    }, [publicKey]);

    return (
        <div style={{ maxHeight: "400px", overflowY: "auto", marginTop: "2rem" }}>
            <h2>Transaction History</h2>
            {publicKey ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th>Signature</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx, index) => (
                            <tr key={index}>
                                <td>
                                    <a
                                        href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "blue" }}
                                    >
                                        {tx.signature.slice(0, 8)}...
                                    </a>
                                </td>
                                <td>{tx.date}</td>
                                <td>{tx.status}</td>
                                \
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Connect your wallet to see transaction history.</p>
            )}
        </div>
    );
}


export default TransactionHistory;
