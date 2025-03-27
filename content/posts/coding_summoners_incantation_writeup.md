---
title: CTF Writeup ~ Coding Summoners Incantation // HTBCyberApocalypse2025
date: 2025-03-27
description: We are given a list of integers representing the energy of magical tokens. We need to find the maximum sum of selected numbers such that no two chosen numbers are adjacent. This is a variation of the Maximum Sum of Non-Adjacent Numbers problem, which can be solved efficiently using Dynamic Programming (DP).
# image: images/htb/blockchain_heliosdex_writeup_step1.png
# imageAltAttribute: Coding Dragon Fury writeup
tags:
- ctf
- HTBCyberApocalypse2025
- writeups
- coding
---


# CHALLENGE NAME: Summoners Incantation

## Description:

To awaken the ancient power of the Dragon's Heart, the summoners must combine magical incantation tokens. However, the tokens are delicate; no two adjacent tokens can be combined without losing their energy. The optimal incantation is the maximum sum obtainable by choosing non-adjacent tokens.

**Points:** 925
**Difficulty:** Very Easy

---

## Walkthrough:

### **Step 1: Understanding the Problem**
- We are given a list of integers representing the energy of magical tokens.
- We need to find the maximum sum of selected numbers such that **no two chosen numbers are adjacent**.
- This is a variation of the **Maximum Sum of Non-Adjacent Numbers** problem, which can be solved efficiently using **Dynamic Programming (DP)**.

### **Step 2: Identifying the Best Approach**
- A brute-force approach would involve checking all subsets of numbers while ensuring no two adjacent numbers are selected, but this is inefficient.
- Instead, we use **Dynamic Programming**:
  - Maintain two values:
    1. `include` → Maximum sum including the current token.
    2. `exclude` → Maximum sum excluding the current token.
  - Update these values iteratively to build the optimal solution.

### **Step 3: Implementing the Algorithm**
1. Initialize `include = 0` and `exclude = 0`.
2. Iterate over the list of token energies and update values using:
   - `new_include = exclude + current_token` (choosing the current token)
   - `exclude = max(include, exclude)` (choosing the best sum from the previous step)
   - `include = new_include`
3. The final result is the maximum of `include` and `exclude`.

### **Step 4: Writing the Python Code**
```python
import ast

# Read input as a string and convert it to a list
tokens = ast.literal_eval(input())

# Edge case: If the list is empty, return 0
if not tokens:
    print(0)
    exit()

# Initialize variables
include, exclude = 0, 0

for num in tokens:
    new_include = exclude + num  # Take the current token
    exclude = max(include, exclude)  # Best result without taking the current token
    include = new_include  # Update include

# The answer is the maximum of include and exclude
print(max(include, exclude))
```

### **Step 5: Testing the Solution**
- **Input:** `[3, 2, 5, 10, 7]`
  - Optimal selection: `3 + 5 + 7 = 15`
  - **Output:** `15`

- **Input:** `[10, 18, 4, 7]`
  - Optimal selection: `18 + 7 = 25`
  - **Output:** `25`

### **Step 6: Complexity Analysis**
- **Time Complexity:** O(N) → We iterate through the list once.
- **Space Complexity:** O(1) → Uses only a few extra variables.

---

## **Captured Flag:**
```zsh
HTB{SUMM0N3RS_INC4NT4T10N_R3S0LV3D_fece9a65c3b44e56cd986e7cfe1105b5}
```


