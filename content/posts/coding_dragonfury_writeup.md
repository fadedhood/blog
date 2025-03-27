---
title: CTF Writeup ~ Coding Dragon Fury // HTBCyberApocalypse2025
date: 2025-03-27
description: We are given a list of subarrays where each subarray represents possible damage values for one attack round. We must pick exactly one number from each subarray so that their sum equals a given target damage.
image: images/htb/blockchain_heliosdex_writeup_step1.png
imageAltAttribute: Blockchain heliosdex writeup
tags:
- ctf
- HTBCyberApocalypse2025
- writeups
- coding
---


# CHALLENGE NAME: Dragon's Fury Simulation

## Description:

In the epic battle against Malakar's dark forces, the ancient dragons must unleash a series of precise attacks. Each attack round offers several potential damage values—but only one combination of attacks will sum up exactly to the damage required to vanquish the enemy.

**Points:** 925\
**Difficulty:** Very Easy

---

## Walkthrough:

### **Step 1: Understanding the Problem**
- We are given a list of subarrays where each subarray represents possible damage values for one attack round.
- We must pick exactly one number from each subarray so that their sum equals a given target damage.
- It is guaranteed that there is only one valid solution.

### **Step 2: Identifying the Best Approach**
- A brute-force approach would involve trying all possible combinations, but that is inefficient.
- Instead, we use **recursive backtracking**:
  - Try each possible damage value from each round.
  - Accumulate the sum and check if we can reach the target.
  - If a valid solution is found, return it immediately.

### **Step 3: Implementing the Algorithm**
1. **Input Parsing:**
   - Read the input, which consists of a list of subarrays and a target integer.
   - Convert the string representation of the list into an actual Python list using `ast.literal_eval()`.
2. **Recursive Backtracking:**
   - Iterate through each subarray and try each possible value.
   - Accumulate the sum and continue to the next subarray.
   - Stop when a valid combination is found.

### **Step 4: Writing the Python Code**
```python
import sys
import ast

# Read all input lines from stdin
data = sys.stdin.read().strip().splitlines()

if not data:
    print("Invalid input format")
    exit()

# Determine input format: either one line or two lines
if len(data) == 1:
    try:
        damage_options_str, target_damage_str = data[0].rsplit(" ", 1)
    except Exception:
        print("Invalid input format")
        exit()
else:
    damage_options_str = data[0]
    target_damage_str = data[1]

# Parse the inputs
try:
    damage_options = ast.literal_eval(damage_options_str)
    target_damage = int(target_damage_str)
    
    if not isinstance(damage_options, list):
        raise ValueError("Damage options should be a list")
except Exception:
    print("Invalid input format")
    exit()

def find_combination(index, current_sum, selected):
    if index == len(damage_options):
        if current_sum == target_damage:
            print(selected)
            exit()
        return

    for value in damage_options[index]:
        find_combination(index + 1, current_sum + value, selected + [value])

find_combination(0, 0, [])
print("No valid combination found")
```

### **Step 5: Complexity Analysis**
- **Time Complexity:** O(N * M) where N is the number of attack rounds and M is the average number of possible damage values per round.
- **Space Complexity:** O(N) due to the recursion stack and selected values storage.

---

## **Captured Flag:**
```zsh
HTB{DR4G0NS_FURY_SIM_C0MB0_c82391183b7c624d002a3160ee38c8a9}
```

