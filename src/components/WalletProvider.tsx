import {FC,ReactNode, useMemo} from 'react';
import { ConnectionProvider, WalletProvider} from '@solana/wallet-adapter-react';
import {WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import {UnsafeBurnerWalletAdapter,} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

interface Props {
    children: ReactNode;
  }

export const Wallet: FC<Props> = ({children}) => {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallets = useMemo(
        () => [
            new UnsafeBurnerWalletAdapter(),
        ],
        [network]
    );

    return(
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                <WalletMultiButton/>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );

}

export default Wallet;