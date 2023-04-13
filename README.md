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
    - [x] Implementation
    - [x] Tests
  - [ ] Cancel option (if not bought)
    - [x] Implementation
    - [ ] Tests
  - [x] Buy option
    - [x] Implementation
    - [x] Tests
  - [x] Exercise option
    - [x] Implementation
    - [x] Tests
  - [ ] Expire option
    - [x] Implementation
    - [ ] Tests
- [ ] Frontend
  - [x] Connect wallet
  - [x] Create option
  - [x] Configure option
  - [x] Fund contract
  - [x] Approve contract for NFT
  - [x] Set up custody
  - [x] Buy option
  - [x] Exercise option
  - [ ] Cancel option
  - [ ] Expire option
