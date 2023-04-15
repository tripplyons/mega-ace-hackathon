# MEGA-ACE Hackathon Project: NFT Call Options

- Live Testnet Interface: [link](https://mega-ace-hackathon.vercel.app/)
- Writeup: [link](https://docs.google.com/document/d/1tKliCBK-vu15TBkzHTmNFl_5S8FH8mdb52kGDX0oVlQ/edit?usp=sharing)
- Pitch Video: [link](https://youtu.be/W0JeFVygYyw)

## Overview

An Algorand smart contract and dapp that allows NFT holders to sell options against their NFTs, and allows NFT traders to buy those options.

## Option Mechanics

- Call option: the buyer has the right to buy the NFT from the seller for a strike price
- Equity settled: the option is settled by transferring the NFT to the buyer for a strike price
- American-style: this can only be done once, before the expiry date

## Usage Instructions

### Prerequisites

- Python 3 and pip
- Node.js and npm
- [algokit](https://github.com/algorandfoundation/algokit-cli)

### Setup

#### Create a virtual environment for the Python dependencies

```sh
python3 -m venv .venv
```

#### Activate the virtual environment

On Linux and macOS:

```sh
source .venv/bin/activate
```

On Windows:

```sh
.venv\Scripts\activate.bat
```

#### Install the Python dependencies

```sh
python3 -m pip install -r requirements.txt
```

#### Compile the smart contract

This step requires your algokit localnet node to be running:

```sh
algokit localnet start
```

Compile command:

```sh
python3 contracts/option.py
```

#### Install the dapp frontend dependencies

```sh
cd dapp
npm install
```

### Run the dapp

```sh
cd dapp
npm run dev
```

This will start a local server at [http://localhost:3000](http://localhost:3000).

### Try out the dapp

You can visit the page in a web browser to interact with the dapp.

It supports many different wallet options for connecting to the Algorand network:

- Pera
- MyAlgo
- Defly
- Exodus
- AlgoSigner
- WalletConnect

**Note:** The dapp is configured to run on the Algorand TestNet, so you will need to [fund your wallet with some testnet ALGO](https://bank.testnet.algorand.network/). You can also edit `dapp/.env.local` if you want to use a different network.
