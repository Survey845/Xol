import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { FC, useEffect, useState } from "react";

interface TokenBalance {
    name: string;
    mint: string;
    amount: string;
}

export const BalanceDisplay: FC = () => {
    const [balances, setBalances] = useState<TokenBalance[]>([]);
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    // Function to fetch both SOL + SPL token balances
    const fetchBalances = async () => {
        if (!publicKey) return;

        const updatedBalances: TokenBalance[] = [];

        // Fetch SOL
        const solAccountInfo = await connection.getAccountInfo(publicKey);
        if (solAccountInfo) {
            updatedBalances.push({
                name: "Solana",
                mint: "SOL",
                amount: (solAccountInfo.lamports / LAMPORTS_PER_SOL).toFixed(4),
            });
        }

        // Fetch SPL tokens
        const splResponse = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID,
        });

        const splTokens = splResponse.value.map((accountInfo) => {
            const parsed = accountInfo.account.data.parsed.info;
            const mint = parsed.mint;
            const amount = parsed.tokenAmount.uiAmountString || "0";
            return {
                name: `Token ${mint.slice(0, 6)}`, // Placeholder
                mint,
                amount,
            };
        });

        updatedBalances.push(...splTokens);
        setBalances(updatedBalances);
    };

    // Fetch on first mount & when publicKey changes
    useEffect(() => {
        fetchBalances();
    }, [connection, publicKey]);

    // Real-time update using onAccountChange
    useEffect(() => {
        if (!publicKey) {
          setBalances([]); 
          return;
        }

        const id = connection.onAccountChange(
            publicKey,
            () => {
                fetchBalances();
            },
            "confirmed"
        );

        // Cleanup subscription
        return () => {
            connection.removeAccountChangeListener(id);
        };
    }, [connection, publicKey]);

    return (
        <div>
            <p>{publicKey ? `Address: ${publicKey.toBase58()}` : "Wallet not connected"}</p>
            <h3>Token Balances</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={{ border: "1px solid black", padding: "8px" }}>Token</th>
                        <th style={{ border: "1px solid black", padding: "8px" }}>Mint Address</th>
                        <th style={{ border: "1px solid black", padding: "8px" }}>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {balances.map((token, index) => (
                        <tr key={index}>
                            <td style={{ border: "1px solid black", padding: "8px" }}>{token.name}</td>
                            <td style={{ border: "1px solid black", padding: "8px" }}>{token.mint}</td>
                            <td style={{ border: "1px solid black", padding: "8px" }}>{token.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={fetchBalances} style={{ marginTop: "1rem" }}>
                Refresh
            </button>
        </div>
    );
};

export default BalanceDisplay;
