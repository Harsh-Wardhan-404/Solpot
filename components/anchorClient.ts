"use client";

import { AnchorProvider, Program, web3, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import IDL from "../anchor/IDL/universal_pot.json";

const ACCOUNT_DISCRIMINATORS: Record<string, number[]> = {
  pot: [21, 239, 13, 42, 248, 174, 64, 150],
  depositorState: [66, 216, 183, 183, 211, 98, 139, 140],
};

const INSTRUCTION_DISCRIMINATORS: Record<string, number[]> = {
  initPot: [96, 74, 54, 30, 99, 102, 115, 37],
  deposit: [242, 35, 198, 137, 82, 225, 242, 182],
  finalize: [171, 61, 218, 56, 127, 115, 12, 217],
};

const normalizeType = (type: any): any => {
  if (typeof type === "string") {
    return type === "publicKey" ? "pubkey" : type;
  }

  if (type && typeof type === "object") {
    if ("option" in type) {
      return { option: normalizeType(type.option) };
    }
    if ("vec" in type) {
      return { vec: normalizeType(type.vec) };
    }
    if ("array" in type) {
      const [arrayType, arrayLength] = type.array || [];
      return { array: [normalizeType(arrayType), arrayLength] };
    }
    if ("defined" in type) {
      const defined = type.defined;
      if (defined && typeof defined === "object") {
        const generics = Array.isArray(defined.generics)
          ? defined.generics.map((generic: any) => {
              if (generic?.kind === "type") {
                return { ...generic, type: normalizeType(generic.type) };
              }
              return generic;
            })
          : undefined;
        return {
          defined: {
            ...defined,
            generics,
          },
        };
      }

      return { defined };
    }
  }

  return type;
};

const normalizeFields = (fields: any) => {
  if (!Array.isArray(fields)) {
    return fields;
  }

  return fields.map((field: any) => {
    if (field && typeof field === "object" && "type" in field) {
      return {
        ...field,
        type: normalizeType((field as any).type),
      };
    }

    return normalizeType(field);
  });
};

const normalizeTypeDef = (typeDef: any) => {
  if (!typeDef || typeof typeDef !== "object") {
    return typeDef;
  }

  if (typeDef.kind === "struct") {
    return {
      ...typeDef,
      fields: normalizeFields(typeDef.fields),
    };
  }

  if (typeDef.kind === "enum") {
    const variants = Array.isArray(typeDef.variants)
      ? typeDef.variants.map((variant: any) => ({
          ...variant,
          fields: normalizeFields(variant.fields),
        }))
      : typeDef.variants;

    return {
      ...typeDef,
      variants,
    };
  }

  if (typeDef.kind === "type") {
    return {
      ...typeDef,
      alias: normalizeType(typeDef.alias),
    };
  }

  return typeDef;
};

const prepareIdl = (rawIdl: any, programId: PublicKey) => {
  const idlCopy = JSON.parse(JSON.stringify(rawIdl ?? {}));
  const programAddress = programId.toBase58();

  idlCopy.address = programAddress;
  idlCopy.metadata = { ...(idlCopy.metadata ?? {}), address: programAddress };

  const accounts = Array.isArray(idlCopy.accounts) ? idlCopy.accounts : [];
  const types = Array.isArray(idlCopy.types)
    ? idlCopy.types.map((typeDef: any) => ({
        ...typeDef,
        type: normalizeTypeDef(typeDef.type),
      }))
    : [];
  const typeNames = new Set(types.map((typeDef: any) => typeDef.name));

  accounts.forEach((account: any) => {
    const normalizedAccountType = normalizeTypeDef(account.type);
    account.type = normalizedAccountType;

    if (!typeNames.has(account.name) && account.type) {
      types.push({
        name: account.name,
        type: JSON.parse(JSON.stringify(normalizedAccountType)),
      });
      typeNames.add(account.name);
    }

    if (!account.discriminator) {
      const knownDiscriminator = ACCOUNT_DISCRIMINATORS[account.name];
      if (knownDiscriminator) {
        account.discriminator = knownDiscriminator;
      }
    }
  });

  idlCopy.types = types;
  idlCopy.accounts = accounts;

  const instructions = Array.isArray(idlCopy.instructions) ? idlCopy.instructions : [];
  instructions.forEach((instruction: any) => {
    if (Array.isArray(instruction.args)) {
      instruction.args = instruction.args.map((arg: any) => ({
        ...arg,
        type: normalizeType(arg.type),
      }));
    }

    if (!instruction.discriminator) {
      const knownDiscriminator = INSTRUCTION_DISCRIMINATORS[instruction.name];
      if (knownDiscriminator) {
        instruction.discriminator = knownDiscriminator;
      }
    }
  });

  idlCopy.instructions = instructions;

  return idlCopy;
};

// Define the IDL directly to avoid import issues
// const IDL = {
//   "version": "0.1.0",
//   "name": "universal_pot",
//   "instructions": [
//     {
//       "name": "initPot",
//       "accounts": [
//         { "name": "authority", "isMut": true, "isSigner": true },
//         { "name": "pot", "isMut": true, "isSigner": false },
//         { "name": "systemProgram", "isMut": false, "isSigner": false }
//       ],
//       "args": [
//         { "name": "capacityLamports", "type": "u64" },
//         { "name": "deadlineTs", "type": "i64" },
//         { "name": "feeBps", "type": "u16" },
//         { "name": "cooldownSecs", "type": "u16" }
//       ]
//     },
//     {
//       "name": "deposit",
//       "accounts": [
//         { "name": "user", "isMut": true, "isSigner": true },
//         { "name": "pot", "isMut": true, "isSigner": false },
//         { "name": "depositorState", "isMut": true, "isSigner": false },
//         { "name": "systemProgram", "isMut": false, "isSigner": false }
//       ],
//       "args": [
//         { "name": "amount", "type": "u64" }
//       ]
//     },
//     {
//       "name": "finalize",
//       "accounts": [
//         { "name": "pot", "isMut": true, "isSigner": false },
//         { "name": "winner", "isMut": true, "isSigner": false },
//         { "name": "platformTreasury", "isMut": true, "isSigner": false }
//       ],
//       "args": []
//     }
//   ],
//   "accounts": [
//     {
//       "name": "pot",
//       "type": {
//         "kind": "struct",
//         "fields": [
//           { "name": "authority", "type": "publicKey" },
//           { "name": "capacityLamports", "type": "u64" },
//           { "name": "deadlineTs", "type": "i64" },
//           { "name": "totalDeposited", "type": "u64" },
//           { "name": "lastDepositor", "type": "publicKey" },
//           { "name": "status", "type": "u8" },
//           { "name": "feeBps", "type": "u16" },
//           { "name": "winner", "type": "publicKey" },
//           { "name": "cooldownSecs", "type": "u16" },
//           { "name": "bump", "type": "u8" }
//         ]
//       }
//     },
//     {
//       "name": "depositorState",
//       "type": {
//         "kind": "struct",
//         "fields": [
//           { "name": "lastDepositTs", "type": "i64" },
//           { "name": "totalContributed", "type": "u64" }
//         ]
//       }
//     }
//   ],
//   "errors": [
//     { "code": 6000, "name": "InvalidCapacity", "msg": "Invalid capacity" },
//     { "code": 6001, "name": "InvalidDeadline", "msg": "Invalid deadline" },
//     { "code": 6002, "name": "FeeTooHigh", "msg": "Fee too high" },
//     { "code": 6003, "name": "Closed", "msg": "Pot is closed" },
//     { "code": 6004, "name": "DeadlineReached", "msg": "Deadline reached" },
//     { "code": 6005, "name": "TooSmall", "msg": "Deposit too small" },
//     { "code": 6006, "name": "Overflow", "msg": "Overflow" },
//     { "code": 6007, "name": "Underflow", "msg": "Underflow" },
//     { "code": 6008, "name": "Cooldown", "msg": "Cooldown active" },
//     { "code": 6009, "name": "NotReadyToFinalize", "msg": "Not ready to finalize" },
//     { "code": 6010, "name": "EmptyVault", "msg": "Empty vault" }
//   ]
// }


export function useAnchorProgram(connection: Connection, wallet: any) {
  return useMemo(() => {
    // Check if wallet is connected and has a public key
    if (!wallet || !wallet.connected || !wallet.publicKey || !connection) {
      return null;
    }
    
    const programIdString = process.env.NEXT_PUBLIC_PROGRAM_ID || "UnivPot111111111111111111111111111111111111";
    if (!programIdString) {
      return null;
    }
    console.log("programIdString", programIdString)
    console.log("wallet.publicKey", wallet.publicKey)
    
    try {
      const programId = new web3.PublicKey(programIdString);
      
      const anchorWallet = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction?.bind(wallet),
        signAllTransactions: wallet.signAllTransactions?.bind(wallet),
      };
      
      const provider = new AnchorProvider(connection, anchorWallet, {
        preflightCommitment: "processed",
      });
      setProvider(provider);
      const patchedIdl = prepareIdl(IDL, programId);
      const program = new Program(patchedIdl as any, provider);
      
      return program;
    } catch (error) {
      console.error("Failed to create Anchor program:", error);
      return null;
    }
  }, [connection, wallet]);
}


