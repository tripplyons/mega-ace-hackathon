# Mega Ace Hackathon Project: NFT Call Options

## Overview

An Algorand smart contract and dapp that allows NFT holders to sell options against their NFTs, and allows other users to buy those options.

## Option Mechanics

- Equity settled: the option is settled by transferring the NFT to the buyer for a strike price
- European style: this can only be done once, before the expiry date
- Call option: the buyer has the right to buy the NFT from the seller for a strike price

## Usage Instructions

### Prerequisites

- Python 3 and pip
- Node.js and npm

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

### Compile the smart contract

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
