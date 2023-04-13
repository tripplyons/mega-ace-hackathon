# Mega Ace Hackathon Project: NFT Call Options

## Overview

An Algorand smart contract and dapp that allows NFT holders to sell options against their NFTs, and allows other users to buy those options.

## Option Mechanics

- Equity settled: the option is settled by transferring the NFT to the buyer for a strike price
- European style: this can only be done once, before the expiry date
- Call option: the buyer has the right to buy the NFT from the seller for a strike price

## Progress

- [ ] Smart Contract
  - [x] Transfer NFT to smart contract
  - [x] Cancel option (if not bought)
  - [x] Buy option
  - [x] Exercise option
  - [x] Expire option
  - [ ] Testing
- [ ] Frontend
  - [x] Connect wallet
  - [x] Create option
  - [x] Configure option
  - [ ] Set up custody
  - [ ] Buy option
  - [ ] Exercise option
  - [ ] Cancel option
  - [ ] Expire option
